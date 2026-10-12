import datetime
import uuid
from sqlalchemy import (
    Column,
    String,
    Integer,
    Float,
    Boolean,
    DateTime,
    Text,
    ForeignKey
)
from sqlalchemy.orm import declarative_base, relationship

Base = declarative_base()


class User(Base):
    __tablename__ = "users"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    email = Column(String(255), unique=True, index=True, nullable=False)
    hashed_password = Column(String(255), nullable=False)
    name = Column(String(255), nullable=False)
    department = Column(String(255), default="General")
    role = Column(String(50), default="USER", nullable=False)  # "ADMIN" or "USER"
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    # Relationships
    documents = relationship("Document", back_populates="uploader", foreign_keys="Document.uploader_id")

    def to_dict(self):
        return {
            "id": self.id,
            "email": self.email,
            "name": self.name,
            "department": self.department,
            "role": self.role,
            "is_active": self.is_active,
            "created_at": self.created_at.isoformat() if self.created_at else None,
        }


class Document(Base):
    __tablename__ = "documents"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    filename = Column(String(255), nullable=False)
    stored_filename = Column(String(255), nullable=False)
    file_path = Column(String(500), nullable=False)
    file_size = Column(Integer, default=0)
    department = Column(String(255), default="Academic Affairs")
    academic_year = Column(String(50), default="2024-2025")
    page_count = Column(Integer, default=0)
    chunk_count = Column(Integer, default=0)
    
    # Lifecycle states: PENDING, PROCESSING, APPROVED, REJECTED, INGESTION_FAILED
    status = Column(String(50), default="PENDING", index=True, nullable=False)
    rejection_reason = Column(Text, nullable=True)
    error_message = Column(Text, nullable=True)

    uploader_id = Column(String(36), ForeignKey("users.id"), nullable=True)
    uploader_name = Column(String(255), default="Unknown")
    uploader_email = Column(String(255), default="unknown@college.edu")

    approved_by = Column(String(36), ForeignKey("users.id"), nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)

    uploader = relationship("User", foreign_keys=[uploader_id], back_populates="documents")

    def to_dict(self):
        return {
            "id": self.id,
            "filename": self.filename,
            "file_size": self.file_size,
            "department": self.department,
            "academic_year": self.academic_year,
            "page_count": self.page_count,
            "chunk_count": self.chunk_count,
            "status": self.status,
            "rejection_reason": self.rejection_reason,
            "error_message": self.error_message,
            "uploader_id": self.uploader_id,
            "uploader_name": self.uploader_name,
            "uploader_email": self.uploader_email,
            "approved_by": self.approved_by,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None,
        }


class AuditLog(Base):
    __tablename__ = "audit_logs"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(String(36), nullable=True)
    user_email = Column(String(255), default="System")
    action = Column(String(100), nullable=False)  # e.g., "APPROVE_DOCUMENT", "REJECT_DOCUMENT"
    target_type = Column(String(50), nullable=False)  # "DOCUMENT", "USER", etc.
    target_id = Column(String(100), nullable=True)
    details = Column(Text, nullable=True)  # JSON or descriptive text
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    def to_dict(self):
        return {
            "id": self.id,
            "user_id": self.user_id,
            "user_email": self.user_email,
            "action": self.action,
            "target_type": self.target_type,
            "target_id": self.target_id,
            "details": self.details,
            "created_at": self.created_at.isoformat() if self.created_at else None,
        }


class QueryEvaluation(Base):
    __tablename__ = "query_evaluations"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(String(36), nullable=True)
    user_email = Column(String(255), nullable=True)
    question = Column(Text, nullable=False)
    category = Column(String(50), default="UNKNOWN")  # GENERAL, COLLEGE, UNKNOWN
    
    initial_answer = Column(Text, nullable=True)
    initial_evaluation = Column(Text, nullable=True)  # JSON string
    
    final_answer = Column(Text, nullable=False)
    final_evaluation = Column(Text, nullable=True)  # JSON string
    
    regenerated = Column(Boolean, default=False)
    regeneration_count = Column(Integer, default=0)
    outcome = Column(String(50), default="PASSED")  # PASSED, CORRECTED, UNRESOLVED, ABSTAINED
    
    retrieved_sources = Column(Text, nullable=True)  # JSON string
    latency_ms = Column(Float, default=0.0)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    def to_dict(self):
        return {
            "id": self.id,
            "user_id": self.user_id,
            "user_email": self.user_email,
            "question": self.question,
            "category": self.category,
            "initial_answer": self.initial_answer,
            "initial_evaluation": self.initial_evaluation,
            "final_answer": self.final_answer,
            "final_evaluation": self.final_evaluation,
            "regenerated": self.regenerated,
            "regeneration_count": self.regeneration_count,
            "outcome": self.outcome,
            "retrieved_sources": self.retrieved_sources,
            "latency_ms": self.latency_ms,
            "created_at": self.created_at.isoformat() if self.created_at else None,
        }
