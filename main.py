import os
import shutil
import uuid
import json
import datetime
from pathlib import Path
from typing import Optional, List

from fastapi import (
    FastAPI,
    HTTPException,
    Depends,
    UploadFile,
    File,
    Form,
    status,
    Query
)
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from sqlalchemy.orm import Session
from sqlalchemy import func

from database import init_db, get_db
from models import User, Document, AuditLog, QueryEvaluation
from auth import (
    hash_password,
    verify_password,
    create_access_token,
    get_current_user,
    require_admin,
    require_user,
    get_optional_user
)
from ingestion_service import (
    ingest_document,
    delete_document_from_chroma,
    get_document_chunks_from_chroma,
    collection
)
from rag import ask_question
from injestion import extract_pages

# Initialize database schema on startup
init_db()

app = FastAPI(
    title="Adaptive AI Hallucination Detection and Reduction Framework for RAG Chatbots",
    description="Full-stack adaptive RAG chatbot with AI-based response evaluation and role-based document governance",
    version="2.0.0"
)

# Enable CORS for local development
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

UPLOAD_DIR = Path(__file__).resolve().parent / "uploads"
UPLOAD_DIR.mkdir(parents=True, exist_ok=True)


# ==========================================
# Pydantic Request / Response Schemas
# ==========================================

class UserRegisterRequest(BaseModel):
    email: str
    password: str
    name: str
    department: Optional[str] = "Computer Science"


class UserLoginRequest(BaseModel):
    email: str
    password: str


class ChatRequest(BaseModel):
    question: str


class RejectRequest(BaseModel):
    reason: Optional[str] = "Document does not meet administrative standards or institutional guidelines."


# ==========================================
# System & Health Endpoints
# ==========================================

@app.get("/")
def home():
    return {
        "message": "Adaptive AI Hallucination Detection & Reduction Framework API is running!",
        "version": "2.0.0",
        "docs": "/docs"
    }


@app.get("/health")
def health():
    return {
        "status": "healthy",
        "database": "sqlite_connected",
        "timestamp": datetime.datetime.now(datetime.timezone.utc).isoformat()
    }


# ==========================================
# Authentication Endpoints
# ==========================================

@app.post("/auth/register")
def register(req: UserRegisterRequest, db: Session = Depends(get_db)):
    # Check if user already exists
    existing = db.query(User).filter(User.email == req.email.lower()).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="An account with this email address already exists."
        )

    # Security requirement: Public registration can ONLY create USER role
    hashed_pwd = hash_password(req.password)
    new_user = User(
        email=req.email.lower(),
        hashed_password=hashed_pwd,
        name=req.name.strip(),
        department=req.department or "General",
        role="USER",
        is_active=True,
        created_at=datetime.datetime.now(datetime.timezone.utc)
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    # Audit log
    audit = AuditLog(
        user_id=new_user.id,
        user_email=new_user.email,
        action="USER_REGISTER",
        target_type="USER",
        target_id=new_user.id,
        details=f"New user registered: {new_user.email} (Role: USER)"
    )
    db.add(audit)
    db.commit()

    token = create_access_token({"sub": new_user.id, "email": new_user.email, "role": new_user.role})

    return {
        "user": new_user.to_dict(),
        "access_token": token,
        "token_type": "bearer"
    }


@app.post("/auth/login")
def login(req: UserLoginRequest, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == req.email.lower()).first()
    if not user or not verify_password(req.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password."
        )

    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Your account has been deactivated."
        )

    # Audit log
    audit = AuditLog(
        user_id=user.id,
        user_email=user.email,
        action="USER_LOGIN",
        target_type="USER",
        target_id=user.id,
        details=f"User logged in: {user.email}"
    )
    db.add(audit)
    db.commit()

    token = create_access_token({"sub": user.id, "email": user.email, "role": user.role})

    return {
        "user": user.to_dict(),
        "access_token": token,
        "token_type": "bearer"
    }


@app.get("/auth/me")
def get_me(current_user: User = Depends(get_current_user)):
    return {
        "user": current_user.to_dict()
    }


# ==========================================
# Chatbot Endpoints
# ==========================================

@app.post("/chat")
def chat(
    request: ChatRequest,
    current_user: Optional[User] = Depends(get_optional_user)
):
    question = request.question.strip()
    if not question:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Question cannot be empty."
        )

    user_id = current_user.id if current_user else None
    user_email = current_user.email if current_user else "guest@visitor.local"

    result = ask_question(question, user_id=user_id, user_email=user_email)
    return result


@app.get("/chat/history")
def get_chat_history(
    current_user: User = Depends(require_user),
    db: Session = Depends(get_db)
):
    """Retrieve the current user's past query and evaluation history."""
    queries = (
        db.query(QueryEvaluation)
        .filter(QueryEvaluation.user_id == current_user.id)
        .order_by(QueryEvaluation.created_at.desc())
        .limit(50)
        .all()
    )
    return [q.to_dict() for q in queries]


# ==========================================
# Document Submission Workflow (User & Public)
# ==========================================

@app.post("/documents/upload")
@app.post("/documents/submit")
def submit_document(
    file: UploadFile = File(...),
    department: str = Form("Academic Affairs"),
    academic_year: str = Form("2024-2025"),
    current_user: User = Depends(require_user),
    db: Session = Depends(get_db)
):
    """
    User submits a PDF document for review.
    Initial status: PENDING. Never directly added to ChromaDB.
    """
    # 1. Validate file format
    filename = file.filename or "uploaded.pdf"
    if not filename.lower().endswith(".pdf"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Unsupported file format. Only PDF files are supported."
        )

    # 2. Secure file storage with UUID filename
    file_id = str(uuid.uuid4())
    safe_name = f"{file_id}_{Path(filename).name}"
    save_path = UPLOAD_DIR / safe_name

    try:
        with open(save_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to store uploaded file: {str(e)}"
        )

    file_size = save_path.stat().st_size
    # 15 MB limit check
    if file_size > 15 * 1024 * 1024:
        save_path.unlink(missing_ok=True)
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="File size exceeds the 15 MB limit."
        )

    # 3. Estimate page count safely
    pages = extract_pages(str(save_path))
    page_count = len(pages) if pages else 0

    # 4. Create persistent document request record in PENDING state
    doc_record = Document(
        id=file_id,
        filename=filename,
        stored_filename=safe_name,
        file_path=str(save_path),
        file_size=file_size,
        department=department,
        academic_year=academic_year,
        page_count=page_count,
        chunk_count=0,
        status="PENDING",
        rejection_reason=None,
        error_message=None,
        uploader_id=current_user.id,
        uploader_name=current_user.name,
        uploader_email=current_user.email,
        created_at=datetime.datetime.now(datetime.timezone.utc),
        updated_at=datetime.datetime.now(datetime.timezone.utc)
    )
    db.add(doc_record)

    # 5. Audit log
    audit = AuditLog(
        user_id=current_user.id,
        user_email=current_user.email,
        action="SUBMIT_DOCUMENT",
        target_type="DOCUMENT",
        target_id=file_id,
        details=f"User submitted '{filename}' for administrative approval."
    )
    db.add(audit)
    db.commit()
    db.refresh(doc_record)

    return {
        "message": "Document submitted successfully and queued for administrator review.",
        "document": doc_record.to_dict()
    }


@app.get("/documents/my-submissions")
def get_my_submissions(
    current_user: User = Depends(require_user),
    db: Session = Depends(get_db)
):
    """Retrieve only the authenticated user's submitted documents and their approval statuses."""
    docs = (
        db.query(Document)
        .filter(Document.uploader_id == current_user.id)
        .order_by(Document.created_at.desc())
        .all()
    )
    return [d.to_dict() for d in docs]


@app.get("/documents")
def list_documents(
    q: Optional[str] = Query(None),
    status_filter: Optional[str] = Query(None),
    current_user: Optional[User] = Depends(get_optional_user),
    db: Session = Depends(get_db)
):
    """
    List documents:
    - If caller is ADMIN: returns all documents (or filtered).
    - If caller is regular USER or guest: returns only APPROVED knowledge-base documents.
    """
    query = db.query(Document)

    if not current_user or current_user.role != "ADMIN":
        query = query.filter(Document.status == "APPROVED")
    elif status_filter:
        query = query.filter(Document.status == status_filter.upper())

    if q:
        search_pattern = f"%{q}%"
        query = query.filter(
            (Document.filename.ilike(search_pattern)) |
            (Document.department.ilike(search_pattern))
        )

    docs = query.order_by(Document.created_at.desc()).all()
    return [d.to_dict() for d in docs]


@app.get("/documents/{id}")
def get_document_details(
    id: str,
    current_user: Optional[User] = Depends(get_optional_user),
    db: Session = Depends(get_db)
):
    """Get document details including chunk references from ChromaDB if approved."""
    doc = db.query(Document).filter(Document.id == id).first()
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found.")

    # Authorization: Non-admins cannot see rejected or pending documents belonging to others
    if doc.status != "APPROVED":
        if not current_user or (current_user.role != "ADMIN" and current_user.id != doc.uploader_id):
            raise HTTPException(status_code=403, detail="Access denied to unapproved document.")

    chunks = []
    if doc.status == "APPROVED":
        chunks = get_document_chunks_from_chroma(doc.id)

    doc_data = doc.to_dict()
    doc_data["chunks"] = chunks
    return doc_data


# ==========================================
# Admin Document Governance & Ingestion APIs
# ==========================================

@app.get("/admin/document-requests")
def admin_list_requests(
    status_filter: Optional[str] = Query(None),
    current_user: User = Depends(require_admin),
    db: Session = Depends(get_db)
):
    """Admin queue of all document upload submissions."""
    query = db.query(Document)
    if status_filter:
        query = query.filter(Document.status == status_filter.upper())
    docs = query.order_by(Document.created_at.desc()).all()
    return [d.to_dict() for d in docs]


@app.post("/admin/document-requests/{id}/approve")
def admin_approve_request(
    id: str,
    current_user: User = Depends(require_admin),
    db: Session = Depends(get_db)
):
    """
    Approve document submission:
    Transitions PENDING -> PROCESSING -> Ingests into ChromaDB -> APPROVED.
    """
    doc = db.query(Document).filter(Document.id == id).first()
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found.")

    # Update status to PROCESSING
    doc.status = "PROCESSING"
    doc.approved_by = current_user.id
    doc.updated_at = datetime.datetime.now(datetime.timezone.utc)
    db.commit()

    # Run ingestion pipeline
    ingest_res = ingest_document(doc.id, doc.file_path, doc.filename)

    if ingest_res["success"]:
        doc.status = "APPROVED"
        doc.page_count = ingest_res["page_count"]
        doc.chunk_count = ingest_res["chunk_count"]
        doc.error_message = None
        db.commit()

        # Audit log
        audit = AuditLog(
            user_id=current_user.id,
            user_email=current_user.email,
            action="APPROVE_DOCUMENT",
            target_type="DOCUMENT",
            target_id=doc.id,
            details=f"Admin approved '{doc.filename}' ({ingest_res['chunk_count']} chunks indexed in ChromaDB)."
        )
        db.add(audit)
        db.commit()

        return {
            "message": f"Document '{doc.filename}' approved and successfully indexed.",
            "document": doc.to_dict()
        }
    else:
        # Ingestion failed: Transition to INGESTION_FAILED safely
        doc.status = "INGESTION_FAILED"
        doc.error_message = ingest_res["error"]
        db.commit()

        # Audit log
        audit = AuditLog(
            user_id=current_user.id,
            user_email=current_user.email,
            action="INGESTION_FAILED",
            target_type="DOCUMENT",
            target_id=doc.id,
            details=f"Ingestion failed for '{doc.filename}': {ingest_res['error']}"
        )
        db.add(audit)
        db.commit()

        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Ingestion failed: {ingest_res['error']}. Document marked as INGESTION_FAILED."
        )


@app.post("/admin/document-requests/{id}/reject")
def admin_reject_request(
    id: str,
    req: RejectRequest,
    current_user: User = Depends(require_admin),
    db: Session = Depends(get_db)
):
    """
    Reject document submission:
    Transitions PENDING -> REJECTED. Stores reason. Never enters ChromaDB.
    """
    doc = db.query(Document).filter(Document.id == id).first()
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found.")

    doc.status = "REJECTED"
    doc.rejection_reason = req.reason or "Rejected by administrator."
    doc.updated_at = datetime.datetime.now(datetime.timezone.utc)
    db.commit()

    # Audit log
    audit = AuditLog(
        user_id=current_user.id,
        user_email=current_user.email,
        action="REJECT_DOCUMENT",
        target_type="DOCUMENT",
        target_id=doc.id,
        details=f"Admin rejected '{doc.filename}'. Reason: {doc.rejection_reason}"
    )
    db.add(audit)
    db.commit()

    return {
        "message": f"Document '{doc.filename}' has been rejected.",
        "document": doc.to_dict()
    }


@app.post("/admin/document-requests/{id}/retry")
def admin_retry_ingestion(
    id: str,
    current_user: User = Depends(require_admin),
    db: Session = Depends(get_db)
):
    """Retry ingestion for documents that previously failed (INGESTION_FAILED)."""
    doc = db.query(Document).filter(Document.id == id).first()
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found.")

    doc.status = "PROCESSING"
    doc.updated_at = datetime.datetime.now(datetime.timezone.utc)
    db.commit()

    ingest_res = ingest_document(doc.id, doc.file_path, doc.filename)

    if ingest_res["success"]:
        doc.status = "APPROVED"
        doc.page_count = ingest_res["page_count"]
        doc.chunk_count = ingest_res["chunk_count"]
        doc.error_message = None
        db.commit()

        # Audit log
        audit = AuditLog(
            user_id=current_user.id,
            user_email=current_user.email,
            action="RETRY_INGESTION_SUCCESS",
            target_type="DOCUMENT",
            target_id=doc.id,
            details=f"Admin retried ingestion for '{doc.filename}'. Success with {ingest_res['chunk_count']} chunks."
        )
        db.add(audit)
        db.commit()

        return {
            "message": f"Ingestion retry succeeded for '{doc.filename}'.",
            "document": doc.to_dict()
        }
    else:
        doc.status = "INGESTION_FAILED"
        doc.error_message = ingest_res["error"]
        db.commit()

        # Audit log
        audit = AuditLog(
            user_id=current_user.id,
            user_email=current_user.email,
            action="RETRY_INGESTION_FAILED",
            target_type="DOCUMENT",
            target_id=doc.id,
            details=f"Ingestion retry failed for '{doc.filename}': {ingest_res['error']}"
        )
        db.add(audit)
        db.commit()

        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Retry failed: {ingest_res['error']}"
        )


@app.delete("/admin/documents/{id}")
@app.delete("/documents/{id}")
def admin_delete_document(
    id: str,
    current_user: User = Depends(require_admin),
    db: Session = Depends(get_db)
):
    """
    Remove document from active knowledge base:
    1. Removes all chunks from ChromaDB.
    2. Deletes or archives the document record.
    3. Records audit log.
    """
    doc = db.query(Document).filter(Document.id == id).first()
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found.")

    # Delete chunks from ChromaDB
    deleted_chunks = delete_document_from_chroma(doc.id)

    # Delete physical file if exists in uploads
    if doc.file_path and "uploads" in doc.file_path:
        try:
            Path(doc.file_path).unlink(missing_ok=True)
        except Exception:
            pass

    filename = doc.filename
    db.delete(doc)
    db.commit()

    # Audit log
    audit = AuditLog(
        user_id=current_user.id,
        user_email=current_user.email,
        action="DELETE_DOCUMENT",
        target_type="DOCUMENT",
        target_id=id,
        details=f"Admin deleted '{filename}' and removed {deleted_chunks} chunks from ChromaDB."
    )
    db.add(audit)
    db.commit()

    return {
        "message": f"Document '{filename}' and {deleted_chunks} indexed chunks removed successfully.",
        "deleted_chunks": deleted_chunks
    }


@app.get("/admin/documents/{id}/preview")
def admin_preview_document(
    id: str,
    current_user: User = Depends(require_admin),
    db: Session = Depends(get_db)
):
    """Preview document text and pages before approving."""
    doc = db.query(Document).filter(Document.id == id).first()
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found.")

    pages = extract_pages(doc.file_path)
    return {
        "document": doc.to_dict(),
        "total_pages": len(pages),
        "preview_pages": pages[:5]  # First 5 pages preview
    }


# ==========================================
# Admin Analytics & Audit Logs APIs
# ==========================================

@app.get("/admin/analytics")
@app.get("/analytics")
def get_analytics(
    current_user: User = Depends(require_admin),
    db: Session = Depends(get_db)
):
    """
    Real analytics computed directly from SQLite persistent data:
    - Overview metrics
    - Hallucination detection & bounded regeneration metrics
    - Daily volume & pass/fail trends
    """
    total_users = db.query(User).count()
    total_submissions = db.query(Document).count()
    pending_requests = db.query(Document).filter(Document.status == "PENDING").count()
    approved_docs = db.query(Document).filter(Document.status == "APPROVED").count()
    rejected_submissions = db.query(Document).filter(Document.status == "REJECTED").count()
    failed_ingestions = db.query(Document).filter(Document.status == "INGESTION_FAILED").count()

    total_chunks = collection.count()
    total_queries = db.query(QueryEvaluation).count()

    # Successful responses: outcomes PASSED or CORRECTED
    successful_responses = (
        db.query(QueryEvaluation)
        .filter(QueryEvaluation.outcome.in_(["PASSED", "CORRECTED"]))
        .count()
    )

    # Flagged responses: queries where regenerated == True
    flagged_responses = (
        db.query(QueryEvaluation)
        .filter(QueryEvaluation.regenerated == True)
        .count()
    )

    # Corrected responses: initial attempt failed, subsequent attempt passed
    corrected_responses = (
        db.query(QueryEvaluation)
        .filter(QueryEvaluation.outcome == "CORRECTED")
        .count()
    )

    # Abstained count
    abstained_count = (
        db.query(QueryEvaluation)
        .filter(QueryEvaluation.outcome == "ABSTAINED")
        .count()
    )

    # Average latency
    avg_latency = db.query(func.avg(QueryEvaluation.latency_ms)).scalar() or 0.0

    # Average regeneration count
    avg_regens = db.query(func.avg(QueryEvaluation.regeneration_count)).scalar() or 0.0

    # Evaluate College queries for detailed research breakdown
    college_evals = db.query(QueryEvaluation).filter(QueryEvaluation.category == "COLLEGE").all()
    total_college = len(college_evals)

    faithfulness_pass = 0
    groundedness_pass = 0
    relevance_pass = 0
    completeness_pass = 0
    consistency_pass = 0

    initial_pass_count = 0
    final_pass_count = 0

    for q in college_evals:
        # Check initial evaluation
        if q.initial_evaluation:
            try:
                init_ev = json.loads(q.initial_evaluation)
                if (
                    init_ev.get("faithfulness") == "PASS"
                    and init_ev.get("relevance") == "PASS"
                    and init_ev.get("groundedness") == "PASS"
                    and init_ev.get("completeness") == "PASS"
                    and init_ev.get("factual_consistency") == "PASS"
                ):
                    initial_pass_count += 1
            except Exception:
                pass

        # Check final evaluation
        if q.final_evaluation:
            try:
                fin_ev = json.loads(q.final_evaluation)
                if fin_ev.get("faithfulness") == "PASS":
                    faithfulness_pass += 1
                if fin_ev.get("groundedness") == "PASS":
                    groundedness_pass += 1
                if fin_ev.get("relevance") == "PASS":
                    relevance_pass += 1
                if fin_ev.get("completeness") == "PASS":
                    completeness_pass += 1
                if fin_ev.get("factual_consistency") == "PASS":
                    consistency_pass += 1

                if (
                    fin_ev.get("faithfulness") == "PASS"
                    and fin_ev.get("relevance") == "PASS"
                    and fin_ev.get("groundedness") == "PASS"
                    and fin_ev.get("completeness") == "PASS"
                    and fin_ev.get("factual_consistency") == "PASS"
                ):
                    final_pass_count += 1
            except Exception:
                pass

    eval_denom = max(1, total_college)
    faithfulness_score = round((faithfulness_pass / eval_denom) * 100, 1)
    groundedness_score = round((groundedness_pass / eval_denom) * 100, 1)
    relevance_score = round((relevance_pass / eval_denom) * 100, 1)
    completeness_score = round((completeness_pass / eval_denom) * 100, 1)
    consistency_score = round((consistency_pass / eval_denom) * 100, 1)

    correction_rate = (
        round((corrected_responses / max(1, flagged_responses)) * 100, 1)
        if flagged_responses > 0
        else 100.0
    )

    # Compute 7-day query timeline
    now = datetime.datetime.now(datetime.timezone.utc)
    timeline = []
    for days_ago in reversed(range(7)):
        target_date = (now - datetime.timedelta(days=days_ago)).date()
        day_queries = (
            db.query(QueryEvaluation)
            .filter(func.date(QueryEvaluation.created_at) == target_date.isoformat())
            .all()
        )
        passed = sum(1 for q in day_queries if q.outcome in ["PASSED", "CORRECTED"])
        failed = len(day_queries) - passed
        timeline.append({
            "date": target_date.strftime("%b %d"),
            "queries": len(day_queries),
            "passed": passed,
            "failed": failed
        })

    return {
        "overview": {
            "total_users": total_users,
            "total_submissions": total_submissions,
            "pending_requests": pending_requests,
            "approved_documents": approved_docs,
            "rejected_submissions": rejected_submissions,
            "failed_ingestion_jobs": failed_ingestions,
            "active_knowledge_base_documents": approved_docs,
            "total_indexed_chunks": total_chunks,
            "total_chatbot_queries": total_queries,
            "successful_responses": successful_responses,
            "flagged_responses": flagged_responses,
            "average_latency_ms": round(avg_latency, 1),
            "average_regeneration_attempts": round(avg_regens, 2),
            "abstained_count": abstained_count,
            "corrected_count": corrected_responses
        },
        "hallucination_analytics": {
            "total_evaluated_answers": total_college,
            "flagged_count": flagged_responses,
            "flagged_percentage": round((flagged_responses / max(1, total_college)) * 100, 1),
            "correction_success_rate": correction_rate,
            "faithfulness_score": faithfulness_score,
            "groundedness_score": groundedness_score,
            "relevance_score": relevance_score,
            "completeness_score": completeness_score,
            "factual_consistency_score": consistency_score,
            "initial_pass_rate": round((initial_pass_count / eval_denom) * 100, 1),
            "final_pass_rate": round((final_pass_count / eval_denom) * 100, 1),
            "abstained_percentage": round((abstained_count / eval_denom) * 100, 1)
        },
        "timeline": timeline
    }


@app.get("/admin/audit-logs")
def get_audit_logs(
    limit: int = 50,
    current_user: User = Depends(require_admin),
    db: Session = Depends(get_db)
):
    """Retrieve chronological audit trail of administrative actions."""
    logs = (
        db.query(AuditLog)
        .order_by(AuditLog.created_at.desc())
        .limit(limit)
        .all()
    )
    return [l.to_dict() for l in logs]


@app.get("/admin/users")
@app.get("/users")
def get_users_list(
    current_user: User = Depends(require_admin),
    db: Session = Depends(get_db)
):
    """Admin list of registered users."""
    users = db.query(User).order_by(User.created_at.desc()).all()
    return [u.to_dict() for u in users]