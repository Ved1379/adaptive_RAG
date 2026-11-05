import os
from pathlib import Path
from dotenv import load_dotenv
from sqlalchemy import create_engine
from sqlalchemy.engine import make_url
from sqlalchemy.orm import sessionmaker
from models import Base

load_dotenv()

BASE_DIR = Path(__file__).resolve().parent
SQLITE_DB_PATH = BASE_DIR / "adaptive_rag.db"


def normalize_database_url(database_url: str, base_dir: Path = BASE_DIR) -> str:
    """Anchor relative SQLite files to the project directory, independent of CWD."""
    url = make_url(database_url)
    database_path = url.database
    if (
        url.get_backend_name() == "sqlite"
        and database_path
        and database_path != ":memory:"
        and not database_path.startswith("file:")
    ):
        path = Path(database_path)
        if not path.is_absolute():
            url = url.set(database=str((base_dir / path).resolve()))
    return str(url)

# Default to SQLite for seamless prototype & local persistence without needing a Postgres server
DATABASE_URL = os.getenv("DATABASE_URL")
if not DATABASE_URL:
    DATABASE_URL = f"sqlite:///{SQLITE_DB_PATH}"
DATABASE_URL = normalize_database_url(DATABASE_URL, BASE_DIR)

# Configure engine
connect_args = {}
if DATABASE_URL.startswith("sqlite"):
    connect_args = {"check_same_thread": False}

engine = create_engine(
    DATABASE_URL,
    connect_args=connect_args,
    echo=False
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


def init_db():
    """Create all tables in the database if they don't already exist."""
    Base.metadata.create_all(bind=engine)
    print("Database tables initialized successfully at:", DATABASE_URL)


def get_db():
    """FastAPI dependency for yielding database sessions."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
