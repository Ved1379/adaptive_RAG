import sys
import types
import uuid
from pathlib import Path

import pytest
from fastapi import HTTPException

from auth import require_admin
from database import SessionLocal, init_db
from models import AuditLog, Document, User


class _Encoder:
    def encode(self, *_args, **_kwargs):
        return [0.0] * 384


if "embeddings" not in sys.modules:
    test_embeddings = types.ModuleType("embeddings")
    test_embeddings.model = _Encoder()
    test_embeddings.generate_embeddings = lambda texts: None
    sys.modules["embeddings"] = test_embeddings

import main


@pytest.fixture
def deletion_accounts():
    init_db()
    db = SessionLocal()
    suffix = uuid.uuid4().hex
    admin = User(
        email=f"delete-admin-{suffix}@test.invalid",
        hashed_password="unused",
        name="Delete Admin",
        role="ADMIN",
        is_active=True,
    )
    regular_user = User(
        email=f"delete-user-{suffix}@test.invalid",
        hashed_password="unused",
        name="Delete User",
        role="USER",
        is_active=True,
    )
    db.add_all([admin, regular_user])
    db.commit()
    db.refresh(admin)
    db.refresh(regular_user)
    db.close()
    doc_ids = []
    try:
        yield admin, regular_user, doc_ids
    finally:
        cleanup = SessionLocal()
        if doc_ids:
            cleanup.query(AuditLog).filter(AuditLog.target_id.in_(doc_ids)).delete(synchronize_session=False)
            cleanup.query(Document).filter(Document.id.in_(doc_ids)).delete(synchronize_session=False)
        cleanup.query(User).filter(User.id.in_([admin.id, regular_user.id])).delete(synchronize_session=False)
        cleanup.commit()
        cleanup.close()


def _create_document(tmp_path, doc_ids):
    document_id = str(uuid.uuid4())
    file_path = tmp_path / f"{document_id}.pdf"
    file_path.write_bytes(b"synthetic uploaded PDF placeholder")
    db = SessionLocal()
    document = Document(
        id=document_id,
        filename="deletion-test.pdf",
        stored_filename=file_path.name,
        file_path=str(file_path),
        file_size=file_path.stat().st_size,
        status="APPROVED",
    )
    db.add(document)
    db.commit()
    db.close()
    doc_ids.append(document_id)
    return document_id, file_path


def test_admin_delete_removes_chunks_file_record_and_writes_audit(
    tmp_path, monkeypatch, deletion_accounts
):
    admin, _regular_user, doc_ids = deletion_accounts
    document_id, file_path = _create_document(tmp_path, doc_ids)
    monkeypatch.setattr(main, "UPLOAD_DIR", tmp_path)
    monkeypatch.setattr(main, "delete_document_from_chroma", lambda _document_id: 3)

    db = SessionLocal()
    try:
        response = main.admin_delete_document(document_id, current_user=admin, db=db)
    finally:
        db.close()

    assert response["deleted_chunks"] == 3
    assert not file_path.exists()
    db = SessionLocal()
    try:
        assert db.query(Document).filter(Document.id == document_id).first() is None
        audit = db.query(AuditLog).filter(AuditLog.target_id == document_id).one()
        assert audit.action == "DELETE_DOCUMENT"
    finally:
        db.close()


def test_regular_user_cannot_delete_document(tmp_path, monkeypatch, deletion_accounts):
    _admin, regular_user, doc_ids = deletion_accounts
    document_id, file_path = _create_document(tmp_path, doc_ids)
    called = []
    monkeypatch.setattr(main, "UPLOAD_DIR", tmp_path)
    monkeypatch.setattr(main, "delete_document_from_chroma", lambda _id: called.append(_id))

    with pytest.raises(HTTPException) as error:
        require_admin(regular_user)
    assert error.value.status_code == 403

    delete_routes = [
        route for route in main.app.routes
        if getattr(route, "path", None) in {"/admin/documents/{id}", "/documents/{id}"}
        and "DELETE" in getattr(route, "methods", set())
    ]
    assert {route.path for route in delete_routes} == {
        "/admin/documents/{id}",
        "/documents/{id}",
    }
    assert all(
        any(dependency.call is require_admin for dependency in route.dependant.dependencies)
        for route in delete_routes
    )
    assert called == []
    assert file_path.exists()
    db = SessionLocal()
    try:
        assert db.query(Document).filter(Document.id == document_id).first() is not None
    finally:
        db.close()


def test_missing_document_returns_404_without_vector_cleanup(monkeypatch, deletion_accounts):
    admin, _regular_user, _doc_ids = deletion_accounts
    called = []
    monkeypatch.setattr(main, "delete_document_from_chroma", lambda _id: called.append(_id))

    db = SessionLocal()
    try:
        with pytest.raises(HTTPException) as error:
            main.admin_delete_document(str(uuid.uuid4()), current_user=admin, db=db)
    finally:
        db.close()
    assert error.value.status_code == 404
    assert called == []


def test_chroma_failure_keeps_uploaded_file_and_database_record(
    tmp_path, monkeypatch, deletion_accounts
):
    admin, _regular_user, doc_ids = deletion_accounts
    document_id, file_path = _create_document(tmp_path, doc_ids)
    monkeypatch.setattr(main, "UPLOAD_DIR", tmp_path)

    def fail_vector_delete(_document_id):
        raise RuntimeError("simulated Chroma failure")

    monkeypatch.setattr(main, "delete_document_from_chroma", fail_vector_delete)

    db = SessionLocal()
    try:
        with pytest.raises(HTTPException) as error:
            main.admin_delete_document(document_id, current_user=admin, db=db)
    finally:
        db.close()

    assert error.value.status_code == 503
    assert "ChromaDB cleanup could not be confirmed" in error.value.detail
    assert file_path.exists()
    db = SessionLocal()
    try:
        assert db.query(Document).filter(Document.id == document_id).first() is not None
        assert db.query(AuditLog).filter(AuditLog.target_id == document_id).count() == 0
    finally:
        db.close()


def test_uploaded_file_failure_is_reported_and_record_is_retained(
    tmp_path, monkeypatch, deletion_accounts
):
    admin, _regular_user, doc_ids = deletion_accounts
    document_id, file_path = _create_document(tmp_path, doc_ids)
    monkeypatch.setattr(main, "UPLOAD_DIR", tmp_path)
    monkeypatch.setattr(main, "delete_document_from_chroma", lambda _id: 2)
    original_unlink = Path.unlink

    def fail_uploaded_file_unlink(path, *args, **kwargs):
        if path.resolve() == file_path.resolve():
            raise PermissionError("simulated file lock")
        return original_unlink(path, *args, **kwargs)

    with monkeypatch.context() as patcher:
        patcher.setattr(Path, "unlink", fail_uploaded_file_unlink)
        db = SessionLocal()
        try:
            with pytest.raises(HTTPException) as error:
                main.admin_delete_document(document_id, current_user=admin, db=db)
        finally:
            db.close()

    assert error.value.status_code == 503
    assert "uploaded file could not be removed" in error.value.detail
    assert file_path.exists()
    db = SessionLocal()
    try:
        assert db.query(Document).filter(Document.id == document_id).first() is not None
        assert db.query(AuditLog).filter(AuditLog.target_id == document_id).count() == 0
    finally:
        db.close()
