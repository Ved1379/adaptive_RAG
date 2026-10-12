# Adaptive AI Hallucination Detection and Reduction Framework for RAG Chatbots

**“Adaptive AI Hallucination Detection and Reduction Framework for Retrieval-Augmented Generation (RAG) Chatbots Using AI-Based Response Evaluation”**

---

## 📌 1. Project Overview & Research Objective

Retrieval-Augmented Generation (RAG) empowers Large Language Models (LLMs) to query external domain documents before generating responses. However, standard RAG architectures frequently hallucinate: they extrapolate unsupported facts, introduce external pre-training biases, fabricate citations, or fail to abstain when evidence is incomplete.

This major research project implements an **Adaptive AI Hallucination Detection and Reduction Framework** featuring:
1. **Multi-Dimensional AI Response Evaluation**: Automatically audits every generated response across **5 criteria**: *Faithfulness*, *Groundedness*, *Relevance*, *Completeness*, and *Factual Consistency*.
2. **Adaptive Bounded Regeneration Feedback**: When a response is flagged by the evaluator, the system initiates a bounded critique-and-refinement loop (up to 3 attempts) with targeted prompt feedback, suppressing hallucinations.
3. **Evidence-Grounded Abstention**: If the evidence is insufficient or checks fail after bounded regeneration, the system cleanly abstains rather than inventing misleading facts.
4. **Two-Tier Role-Based Document Governance (`ADMIN` vs `USER`)**:
   - **Administrators**: Review pending document submissions, preview extracted pages, approve or reject with reasons, monitor ingestion status, retry failed ingestions, safely delete indexed documents with vector-store cleanup, and review audit trails.
   - **Users / Students**: Query the RAG chatbot, review grounded citations (document names and page numbers), submit documents for administrative approval, and monitor submission statuses (`PENDING`, `APPROVED`, `REJECTED`, `PROCESSING`, `INGESTION_FAILED`).
5. **Real Persistent Analytics**: All metrics, latency logs, user records, document requests, and query evaluation scores are persisted in SQLite (SQLAlchemy) and computed dynamically for the admin dashboard.

---

## 🏗️ 2. System Architecture

```
                          ┌───────────────────────────┐
                          │   React + Vite Frontend   │
                          │   (Tailwind / Modern CSS) │
                          └─────────────┬─────────────┘
                                        │ JWT Bearer Auth / REST APIs
                                        ▼
                          ┌───────────────────────────┐
                          │   FastAPI Backend (Py)    │
                          │   main.py / auth.py       │
                          └──────┬──────────────┬─────┘
                                 │              │
                   Governance &  │              │ RAG Pipeline
                   Persistence   │              │
                                 ▼              ▼
           ┌────────────────────────────┐  ┌────────────────────────────────────┐
           │ SQLite (adaptive_rag.db)   │  │ ChromaDB Vector Index              │
           │ - Users (Admin / Student)  │  │ (college_documents collection)     │
           │ - Document Requests        │  │ Chunks + Document metadata         │
           │ - Audit Logs (Immutable)   │  └─────────────────▲──────────────────┘
           │ - Query Evaluations (Real) │                    │
           └────────────────────────────┘                    │
                                                             │
                  ┌──────────────────────────────────────────┴─────────────────┐
                  │               Adaptive RAG Pipeline (rag.py)               │
                  │ 1. Question Classifier (router.py)                         │
                  │ 2. Dense Embeddings (SentenceTransformers all-MiniLM-L6-v2)│
                  │ 3. Approved Document Chunk Retrieval & Citation Mapping    │
                  │ 4. Initial Generation (Google Gemini Client)               │
                  │ 5. 5-Dimension Evaluator (evaluator.py)                    │
                  │    [Faithful, Grounded, Relevant, Complete, Consistent]    │
                  │ 6. Adaptive Feedback Loop (Bounded Regeneration)           │
                  │ 7. Safe Abstention / Fallback Handler                      │
                  └────────────────────────────────────────────────────────────┘
```

---

## 🛠️ 3. Technology Stack

- **Frontend**: React 18, Vite, React Router 6, Lucide React, Axios.
- **Backend**: Python 3.14 / 3.11+, FastAPI, Uvicorn, Pydantic.
- **Database**: SQLite via SQLAlchemy (production-ready, zero-config local persistence).
- **Authentication**: JWT access tokens (`pyjwt`), bcrypt password hashing (`bcrypt`), server-side role validation.
- **Vector Database**: ChromaDB (persistent vector collection).
- **Embeddings**: SentenceTransformers (`all-MiniLM-L6-v2`, 384 dimensions).
- **LLM & Evaluation**: Google Gemini API (`gemini-3.5-flash-lite` configurable).
- **Document Processing**: `pypdf` page extraction and chunking.

---

## 🔐 4. Authentication & Role-Based Access Control

The application enforces strict **server-side RBAC**:

| Role | Permissions |
|---|---|
| **ADMIN** | Access Admin Console; View all documents; Review approval queue; Approve/Reject submissions with reasons; Retry failed ingestions; Delete documents and wipe vector chunks; View audit logs; View user accounts; Monitor live hallucination analytics. |
| **USER** | Use the chatbot; View supporting document citations; Submit PDFs for administrative review; Track personal submission statuses (`PENDING`, `APPROVED`, `REJECTED`) and see rejection reasons. Cannot approve, delete, or modify vector store. |

### Bootstrap Demo Credentials

When `init_db.py` runs, it creates initial accounts:
- **Administrator**: `admin@college.edu` | Password: `Admin@12345`
- **Student User**: `student@college.edu` | Password: `Student@12345`

Public self-registration (`/register` and `POST /auth/register`) can **only** register standard `USER` accounts. Administrative accounts cannot be created publicly.

---

## 📄 5. Document Submission & Ingestion Lifecycle

```
[User Submits PDF] ──> Status: PENDING ──> [Admin Queue]
                                                │
                 ┌──────────────────────────────┴──────────────────────────────┐
                 ▼                                                             ▼
           [Admin Rejects]                                              [Admin Approves]
                 │                                                             │
                 ▼                                                             ▼
         Status: REJECTED                                              Status: PROCESSING
     (Stores rejection reason;                                                 │
      Never enters ChromaDB)                                                   ▼
                                                                     [Ingestion Pipeline]
                                                                     - Extract pages (pypdf)
                                                                     - Overlapping chunking
                                                                     - Dense embedding
                                                                     - ChromaDB upsert
                                                                               │
                                              ┌────────────────────────────────┴────────────────┐
                                              ▼                                                 ▼
                                        [Success]                                           [Failure]
                                              │                                                 │
                                              ▼                                                 ▼
                                       Status: APPROVED                             Status: INGESTION_FAILED
                                   (Active in RAG queries)                           (Admin Retry Available)
```

**Idempotence Guarantee**: Re-ingesting or retrying a document deletes any existing chunks for that `document_id` before upserting, preventing duplicate chunks. Document deletion removes all corresponding chunks from ChromaDB and logs an immutable audit event.

---

## 📊 6. Experimental Benchmark & Research Results

To validate the hallucination reduction claims, an automated benchmark was executed comparing **Single-Shot Baseline RAG** against the **Adaptive AI Verification Framework** across 8 labeled test cases (Answerable, Partially Answerable, Unanswerable, and Adversarial):

| Metric | Baseline RAG | Adaptive RAG (Proposed) | Improvement |
|---|---|---|---|
| **Overall Verification Pass Rate** | 75.0% | **87.5%** | **+12.5%** |
| **Hallucination on Missing/Adversarial** | 4/4 (100.0%) | **1/4 (25.0%)** | **75% Reduction** |
| **Abstention Accuracy on Unanswerable** | 0.0% | **75.0%** | **+75.0%** |
| **Citation Attribution** | 0% (Empty) | **100% (Verifiable)** | **Complete Citations** |
| **Bounded Regeneration Correction** | N/A | Active (Feedback loop) | Adaptive critique |
| **Average Query Latency** | 1,199 ms | 9,037 ms | Trade-off for multi-tier verification |

*Benchmark log report stored at: `experimental_benchmark_report.json`.*

---

## 🚀 7. Installation & Setup Instructions

### Prerequisites
- Python 3.10+ (Tested on Python 3.14 / 3.11)
- Node.js 18+ and npm
- Valid Google Gemini API Key

### Step 1: Clone and Configure Environment

In `adaptive_RAG/.env`:
```ini
GEMINI_API_KEY=your_gemini_api_key_here
GEMINI_MODEL=gemini-3.5-flash-lite
JWT_SECRET_KEY=adaptive-rag-super-secret-key-32-chars-minimum-2026-secure
ADMIN_EMAIL=admin@college.edu
ADMIN_DEFAULT_PASSWORD=Admin@12345
```

### Step 2: Backend Setup & Database Initialization

```bash
cd adaptive_RAG

# Activate virtual environment
.venv\Scripts\activate   # Windows
# source .venv/bin/activate # Linux/Mac

# Install dependencies
pip install -r requirements.txt
pip install pyjwt python-multipart sqlalchemy pytest

# Initialize database tables and bootstrap demo accounts
python init_db.py

# Start FastAPI backend server
python -m uvicorn main:app --host 127.0.0.1 --port 9000
```
Backend will be live at `http://127.0.0.1:9000` (Docs at `http://127.0.0.1:9000/docs`).

### Step 3: Frontend Setup

```bash
cd adaptive_RAG/frontend

# Install node dependencies
npm install

# Start Vite development server
npm run dev
```
Frontend will be live at `http://localhost:5173`.

---

## 🧪 8. Running Automated Tests & Benchmark

### Run the Pytest Test Suite
```bash
cd adaptive_RAG
pytest tests/test_framework.py -v
```
Verifies:
- Password hashing & JWT validation
- User submission initial states
- Rejection reasons preservation
- Vector-store isolation (unapproved docs never in ChromaDB)
- Ingestion idempotence (duplicate prevention)
- Evaluator 5-criteria verifier
- Analytics persistence in SQLite

### Run the Evaluation Benchmark
```bash
cd adaptive_RAG
python evaluation_benchmark.py
```
Executes the empirical comparison between Baseline RAG and Adaptive RAG and outputs `experimental_benchmark_report.json`.

---

## 📚 9. API Reference Summary

- `POST /auth/register` - Public user registration (Role: `USER`)
- `POST /auth/login` - User login & JWT issuance
- `GET /auth/me` - Current authenticated user
- `POST /chat` - Grounded RAG query with adaptive verification
- `GET /chat/history` - User's query evaluation history
- `POST /documents/submit` - User document submission (`PENDING`)
- `GET /documents/my-submissions` - User's own submission statuses
- `GET /documents` - List approved documents (or all if Admin)
- `GET /documents/{id}` - Document details & ChromaDB chunks
- `GET /admin/document-requests` - Admin approval queue
- `POST /admin/document-requests/{id}/approve` - Approve & index in ChromaDB
- `POST /admin/document-requests/{id}/reject` - Reject submission with reason
- `POST /admin/document-requests/{id}/retry` - Retry failed ingestion
- `DELETE /admin/documents/{id}` - Delete doc & remove chunks from ChromaDB
- `GET /admin/documents/{id}/preview` - Preview document pages before approval
- `GET /admin/analytics` - Live research analytics and metric breakdown
- `GET /admin/audit-logs` - Administrative audit trail
- `GET /admin/users` - Registered user accounts list