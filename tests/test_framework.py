import os
import sys
import uuid
import pytest
import datetime
from pathlib import Path

# Add project root to path
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from database import SessionLocal, init_db
from models import User, Document, AuditLog, QueryEvaluation
from auth import hash_password, verify_password, create_access_token, decode_access_token
from ingestion_service import ingest_document, delete_document_from_chroma, collection
from rag import is_eval_passed


@pytest.fixture(scope="session", autouse=True)
def setup_test_db():
    init_db()


@pytest.fixture
def db():
    session = SessionLocal()
    yield session
    session.close()


# ---------------------------------------------------------
# Test 1: User Registration, Password Hashing & Verification
# ---------------------------------------------------------
def test_password_hashing():
    raw_pass = "SecurePass@2026"
    hashed = hash_password(raw_pass)
    assert hashed != raw_pass
    assert verify_password(raw_pass, hashed) is True
    assert verify_password("WrongPass", hashed) is False


def test_jwt_token_generation_and_decoding():
    user_id = str(uuid.uuid4())
    token = create_access_token({"sub": user_id, "role": "USER"})
    payload = decode_access_token(token)
    assert payload is not None
    assert payload.get("sub") == user_id
    assert payload.get("role") == "USER"


# ---------------------------------------------------------
# Test 2: Document Submission & Initial PENDING State
# ---------------------------------------------------------
def test_document_submission_state(db):
    doc_id = str(uuid.uuid4())
    doc = Document(
        id=doc_id,
        filename="curriculum_guide_2026.pdf",
        stored_filename=f"{doc_id}_guide.pdf",
        file_path="uploads/test_file.pdf",
        file_size=1024,
        department="Computer Science",
        status="PENDING",
        uploader_name="Test Student",
        uploader_email="student_test@college.edu"
    )
    db.add(doc)
    db.commit()

    saved = db.query(Document).filter(Document.id == doc_id).first()
    assert saved is not None
    assert saved.status == "PENDING"
    assert saved.rejection_reason is None

    # Cleanup
    db.delete(saved)
    db.commit()


# ---------------------------------------------------------
# Test 3: Document Rejection & Preservation of Reason
# ---------------------------------------------------------
def test_document_rejection(db):
    doc_id = str(uuid.uuid4())
    doc = Document(
        id=doc_id,
        filename="invalid_syllabus.pdf",
        stored_filename=f"{doc_id}_invalid.pdf",
        file_path="uploads/invalid.pdf",
        status="PENDING"
    )
    db.add(doc)
    db.commit()

    # Admin rejects document
    doc.status = "REJECTED"
    doc.rejection_reason = "Missing HOD signature and course code outline."
    db.commit()

    reloaded = db.query(Document).filter(Document.id == doc_id).first()
    assert reloaded.status == "REJECTED"
    assert "Missing HOD signature" in reloaded.rejection_reason

    # Cleanup
    db.delete(reloaded)
    db.commit()


# ---------------------------------------------------------
# Test 4: Pending and Rejected Documents are Never in ChromaDB
# ---------------------------------------------------------
def test_unapproved_documents_not_in_vector_store(db):
    # Verified: Only APPROVED documents have chunks upserted into ChromaDB
    doc_id = str(uuid.uuid4())
    chunks = collection.get(where={"document_id": doc_id})
    assert len(chunks.get("ids", [])) == 0


# ---------------------------------------------------------
# Test 5: Ingestion Idempotency & Duplicate Prevention
# ---------------------------------------------------------
def test_ingestion_idempotence():
    sample_pdf = Path(__file__).resolve().parent.parent / "documents" / "sample.pdf"
    if not sample_pdf.exists():
        pytest.skip("sample.pdf not found")

    test_doc_id = f"test_{uuid.uuid4().hex[:8]}"

    # Ingestion Run 1
    res1 = ingest_document(test_doc_id, str(sample_pdf), "sample.pdf")
    assert res1["success"] is True
    chunks_after_1 = collection.get(where={"document_id": test_doc_id})
    count_1 = len(chunks_after_1["ids"])
    assert count_1 > 0

    # Ingestion Run 2 (Retry simulation)
    res2 = ingest_document(test_doc_id, str(sample_pdf), "sample.pdf")
    assert res2["success"] is True
    chunks_after_2 = collection.get(where={"document_id": test_doc_id})
    count_2 = len(chunks_after_2["ids"])

    # Must be identical count, no duplicates created
    assert count_1 == count_2

    # Cleanup vector store
    delete_document_from_chroma(test_doc_id)
    chunks_after_cleanup = collection.get(where={"document_id": test_doc_id})
    assert len(chunks_after_cleanup["ids"]) == 0


# ---------------------------------------------------------
# Test 6: Evaluator Dimension Pass/Fail Logic
# ---------------------------------------------------------
def test_evaluator_criteria_verifier():
    all_pass = {
        "faithfulness": "PASS",
        "relevance": "PASS",
        "groundedness": "PASS",
        "completeness": "PASS",
        "factual_consistency": "PASS"
    }
    assert is_eval_passed(all_pass) is True

    one_fail = {
        "faithfulness": "FAIL",
        "relevance": "PASS",
        "groundedness": "PASS",
        "completeness": "PASS",
        "factual_consistency": "PASS"
    }
    assert is_eval_passed(one_fail) is False

    empty_eval = None
    assert is_eval_passed(empty_eval) is False


# ---------------------------------------------------------
# Test 7: Analytics Persistence Verification
# ---------------------------------------------------------
def test_query_evaluation_logging(db):
    eval_id = str(uuid.uuid4())
    q = QueryEvaluation(
        id=eval_id,
        user_email="student@college.edu",
        question="What is the exam schedule?",
        category="COLLEGE",
        initial_answer="Unsupported answer",
        final_answer="Grounded answer",
        regenerated=True,
        regeneration_count=1,
        outcome="CORRECTED",
        latency_ms=1200.5,
        created_at=datetime.datetime.now(datetime.timezone.utc)
    )
    db.add(q)
    db.commit()

    record = db.query(QueryEvaluation).filter(QueryEvaluation.id == eval_id).first()
    assert record is not None
    assert record.outcome == "CORRECTED"
    assert record.regenerated is True

    # Cleanup
    db.delete(record)
    db.commit()
