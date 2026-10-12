import os
import datetime
from pathlib import Path
from dotenv import load_dotenv

from database import engine, SessionLocal, init_db
from models import User, Document, AuditLog
from auth import hash_password

load_dotenv()


def seed_database():
    """Create tables and bootstrap the first administrator and standard user accounts."""
    init_db()
    
    db = SessionLocal()
    try:
        # Create uploads directory
        uploads_dir = Path(__file__).resolve().parent / "uploads"
        uploads_dir.mkdir(parents=True, exist_ok=True)

        # Check if admin exists
        admin_email = os.getenv("ADMIN_EMAIL", "admin@college.edu")
        existing_admin = db.query(User).filter(User.role == "ADMIN").first()

        if not existing_admin:
            admin_pwd = os.getenv("ADMIN_DEFAULT_PASSWORD", "Admin@12345")
            admin_user = User(
                email=admin_email,
                hashed_password=hash_password(admin_pwd),
                name="Administrator",
                department="Academic Administration",
                role="ADMIN",
                is_active=True,
                created_at=datetime.datetime.now(datetime.timezone.utc)
            )
            db.add(admin_user)
            db.commit()
            db.refresh(admin_user)

            # Audit log
            audit = AuditLog(
                user_id=admin_user.id,
                user_email=admin_user.email,
                action="INITIALIZE_ADMIN",
                target_type="USER",
                target_id=admin_user.id,
                details=f"System initialized initial administrator account: {admin_email}"
            )
            db.add(audit)
            db.commit()
            print(f"[Init] Initial Administrator created: {admin_email}")
        else:
            print(f"[Init] Administrator account already exists ({existing_admin.email}).")

        # Check if default student user exists
        student_email = "student@college.edu"
        existing_student = db.query(User).filter(User.email == student_email).first()
        if not existing_student:
            student_pwd = os.getenv("STUDENT_DEFAULT_PASSWORD", "Student@12345")
            student_user = User(
                email=student_email,
                hashed_password=hash_password(student_pwd),
                name="Student",
                department="Computer Engineering",
                role="USER",
                is_active=True,
                created_at=datetime.datetime.now(datetime.timezone.utc)
            )
            db.add(student_user)
            db.commit()
            print(f"[Init] Demo Student user created: {student_email}")

        # Check if sample.pdf exists in documents/ and register it as an APPROVED document
        sample_pdf = Path(__file__).resolve().parent / "documents" / "sample.pdf"
        if sample_pdf.exists():
            existing_doc = db.query(Document).filter(Document.filename == "sample.pdf").first()
            if not existing_doc:
                # Count pages
                try:
                    from pypdf import PdfReader
                    reader = PdfReader(str(sample_pdf))
                    page_count = len(reader.pages)
                except Exception:
                    page_count = 1

                doc_record = Document(
                    filename="sample.pdf",
                    stored_filename="sample.pdf",
                    file_path=str(sample_pdf),
                    file_size=sample_pdf.stat().st_size,
                    department="Academic Affairs",
                    academic_year="2024-2025",
                    page_count=page_count,
                    chunk_count=13,  # Sample chunk count
                    status="APPROVED",
                    uploader_name="Academic Administration",
                    uploader_email=admin_email,
                    created_at=datetime.datetime.now(datetime.timezone.utc),
                    updated_at=datetime.datetime.now(datetime.timezone.utc)
                )
                db.add(doc_record)
                db.commit()
                print("[Init] Seeded sample.pdf into active knowledge-base documents table.")

        print("[Init] Database initialization and bootstrap completed successfully.")

    finally:
        db.close()


if __name__ == "__main__":
    seed_database()
