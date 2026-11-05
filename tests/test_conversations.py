import uuid
from pathlib import Path
import sys
import types

import pytest
from fastapi import HTTPException
from fastapi.security import HTTPAuthorizationCredentials
from sqlalchemy import select
from sqlalchemy.engine import make_url

from auth import create_access_token, get_current_user, hash_password
from database import SessionLocal, init_db, normalize_database_url
from models import Conversation, Message, User


class _EmbeddingBatch(list):
    def tolist(self):
        return list(self)


class _OfflineEncoder:
    def encode(self, texts, *args, **kwargs):
        if isinstance(texts, list):
            return _EmbeddingBatch([[0.0] * 384 for _ in texts])
        return [0.0] * 384


# The conversation API tests stub ask_question. Keep importing the app from
# triggering a heavyweight model download; this does not replace RAG in production.
if "embeddings" not in sys.modules:
    test_embeddings = types.ModuleType("embeddings")
    test_embeddings.model = _OfflineEncoder()
    test_embeddings.generate_embeddings = lambda texts: _OfflineEncoder().encode(list(texts))
    sys.modules["embeddings"] = test_embeddings

import main
from main import app


@pytest.fixture
def conversation_users():
    init_db()
    db = SessionLocal()
    suffix = uuid.uuid4().hex
    users = [
        User(email=f"chat-a-{suffix}@test.invalid", hashed_password="unused", name="Chat A", role="USER", is_active=True),
        User(email=f"chat-b-{suffix}@test.invalid", hashed_password="unused", name="Chat B", role="USER", is_active=True),
    ]
    db.add_all(users)
    db.commit()
    for user in users:
        db.refresh(user)
    tokens = [create_access_token({"sub": user.id, "role": user.role}) for user in users]
    db.close()
    try:
        yield users, tokens
    finally:
        db = SessionLocal()
        conversation_ids = select(Conversation.id).where(Conversation.user_id.in_([u.id for u in users]))
        db.query(Message).filter(Message.conversation_id.in_(conversation_ids)).delete(synchronize_session=False)
        db.query(Conversation).filter(Conversation.user_id.in_([u.id for u in users])).delete(synchronize_session=False)
        db.query(User).filter(User.id.in_([u.id for u in users])).delete(synchronize_session=False)
        db.commit()
        db.close()


def test_relative_sqlite_database_url_is_stable_across_working_directories():
    project_root = Path(__file__).resolve().parent.parent
    normalized = normalize_database_url("sqlite:///adaptive_rag.db", project_root)
    assert Path(make_url(normalized).database) == project_root / "adaptive_rag.db"


def test_conversation_ownership_and_authorization(conversation_users):
    users, tokens = conversation_users
    db = SessionLocal()
    try:
        user_a = get_current_user(HTTPAuthorizationCredentials(scheme="Bearer", credentials=tokens[0]), db)
        user_b = get_current_user(HTTPAuthorizationCredentials(scheme="Bearer", credentials=tokens[1]), db)
        a_created = main.create_conversation(user_a, db)
        b_created = main.create_conversation(user_b, db)
        a_id = a_created["id"]
        b_id = b_created["id"]

        assert [item["id"] for item in main.list_conversations(user_a, db)] == [a_id]
        for operation in (
            lambda: main.get_conversation(b_id, user_a, db),
            lambda: main.get_conversation_messages(b_id, user_a, db),
            lambda: main.delete_conversation(b_id, user_a, db),
            lambda: main.chat(main.ChatRequest(
                question="attempt to modify another user's conversation", conversation_id=b_id
            ), user_a, db),
        ):
            with pytest.raises(HTTPException) as error:
                operation()
            assert error.value.status_code == 404
        assert main.get_conversation(b_id, user_b, db)["id"] == b_id
    finally:
        db.close()


def test_conversations_and_chat_require_authentication(conversation_users):
    db = SessionLocal()
    try:
        with pytest.raises(HTTPException) as error:
            get_current_user(None, db)
        assert error.value.status_code == 401
        protected_routes = {
            ("/conversations", "POST"),
            ("/conversations", "GET"),
            ("/conversations/{conversation_id}", "GET"),
            ("/conversations/{conversation_id}/messages", "GET"),
            ("/conversations/{conversation_id}", "DELETE"),
            ("/chat", "POST"),
        }
        protected_seen = set()
        for route in app.routes:
            for method in protected_routes.intersection(
                {(getattr(route, "path", None), item) for item in getattr(route, "methods", set())}
            ):
                protected_seen.add(method)
                assert any(dependency.call.__name__ == "require_user" for dependency in route.dependant.dependencies)
        assert protected_seen == protected_routes
    finally:
        db.close()


def test_chat_persists_messages_and_preserves_rag_pipeline(conversation_users, monkeypatch):
    users, tokens = conversation_users
    import main

    calls = []

    def fake_ask_question(question, user_id=None, user_email=None):
        calls.append((question, user_id, user_email))
        return {
            "answer": "Grounded response",
            "category": "COLLEGE",
            "evaluation": {"faithfulness": "PASS"},
            "sources": [{"document": "approved.pdf", "page": 1}],
            "regenerated": False,
            "outcome": "PASSED",
            "latency_ms": 12.5,
        }

    monkeypatch.setattr(main, "ask_question", fake_ask_question)
    db = SessionLocal()
    try:
        user = get_current_user(HTTPAuthorizationCredentials(scheme="Bearer", credentials=tokens[0]), db)
        payload = main.chat(main.ChatRequest(question="Where is the rule?"), user, db)
        assert payload["answer"] == "Grounded response"
        assert payload["evaluation"] == {"faithfulness": "PASS"}
        assert payload["conversation_id"]
        assert calls == [("Where is the rule?", users[0].id, users[0].email)]
        messages = main.get_conversation_messages(payload["conversation_id"], user, db)
        assert [(m["role"], m["content"]) for m in messages] == [
            ("user", "Where is the rule?"),
            ("assistant", "Grounded response"),
        ]
    finally:
        db.close()


def test_rag_pipeline_control_flow_still_returns_grounded_answer(monkeypatch):
    import rag

    class LogSession:
        def __init__(self):
            self.record = None
            self.committed = False

        def add(self, record):
            self.record = record

        def commit(self):
            self.committed = True

        def close(self):
            pass

    log_session = LogSession()
    monkeypatch.setattr(rag, "classify_question", lambda question: "COLLEGE")
    monkeypatch.setattr(rag, "retrieve_chunks", lambda question: (
        ["The attendance requirement is stated in the approved handbook."],
        [{"document": "handbook.pdf", "page": 2, "chunk_index": 0, "text": "Attendance requirement"}],
    ))
    monkeypatch.setattr(rag, "generate_with_retry", lambda prompt: "The handbook states the attendance requirement.")
    monkeypatch.setattr(rag, "evaluate_answer", lambda context, question, answer: {
        "faithfulness": "PASS", "relevance": "PASS", "groundedness": "PASS",
        "completeness": "PASS", "factual_consistency": "PASS",
    })
    monkeypatch.setattr(rag, "SessionLocal", lambda: log_session)

    result = rag.ask_question("What does the handbook say?", user_id="user-id", user_email="user@test.invalid")
    assert result["answer"] == "The handbook states the attendance requirement."
    assert result["outcome"] == "PASSED"
    assert result["sources"][0]["document"] == "handbook.pdf"
    assert log_session.committed


def test_conversation_restores_after_same_user_logs_in_again(conversation_users, monkeypatch):
    users, tokens = conversation_users
    import main

    password = "conversation-test-password"
    db = SessionLocal()
    user = db.query(User).filter(User.id == users[0].id).first()
    user.hashed_password = hash_password(password)
    db.commit()
    db.close()

    monkeypatch.setattr(main, "ask_question", lambda question, user_id=None, user_email=None: {
        "answer": "persisted assistant answer",
        "category": "COLLEGE",
        "evaluation": {"faithfulness": "PASS"},
        "sources": [],
        "regenerated": False,
        "outcome": "PASSED",
        "latency_ms": 10.0,
    })
    db = SessionLocal()
    try:
        user = db.query(User).filter(User.id == users[0].id).first()
        user.hashed_password = hash_password(password)
        db.commit()
        created = main.create_conversation(user, db)
        conversation_id = created["id"]
        main.chat(main.ChatRequest(
            question="persist this question", conversation_id=conversation_id
        ), user, db)

        # A fresh login issues another token for the same account.
        login = main.login(main.UserLoginRequest(email=users[0].email, password=password), db)
        user_after_login = get_current_user(
            HTTPAuthorizationCredentials(scheme="Bearer", credentials=login["access_token"]), db
        )
        restored = main.list_conversations(user_after_login, db)
        saved = next(item for item in restored if item["id"] == conversation_id)
        assert [(message["role"], message["content"]) for message in saved["messages"]] == [
            ("user", "persist this question"),
            ("assistant", "persisted assistant answer"),
        ]

        other_user = get_current_user(
            HTTPAuthorizationCredentials(scheme="Bearer", credentials=tokens[1]), db
        )
        assert all(item["id"] != conversation_id for item in main.list_conversations(other_user, db))
        with pytest.raises(HTTPException) as error:
            main.get_conversation(conversation_id, other_user, db)
        assert error.value.status_code == 404
    finally:
        db.close()

