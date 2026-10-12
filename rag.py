import os
import re
import json
import time
import datetime
from pathlib import Path
from dotenv import load_dotenv
import chromadb
from google import genai

from embeddings import model
from evaluator import evaluate_answer
from router import classify_question
from database import SessionLocal
from models import Document, QueryEvaluation

load_dotenv()

CHROMA_PATH = Path(__file__).resolve().parent / "chroma_data"
client = chromadb.PersistentClient(path=str(CHROMA_PATH))
collection = client.get_or_create_collection(name="college_documents")

GEMINI_MODEL = os.getenv("GEMINI_MODEL", "gemini-3.5-flash-lite")
gemini_client = genai.Client(api_key=os.getenv("GEMINI_API_KEY"))


def is_eval_passed(eval_dict):
    """Verify if all 5 hallucination evaluation dimensions passed."""
    if not eval_dict or not isinstance(eval_dict, dict):
        return False
    return (
        eval_dict.get("faithfulness") == "PASS"
        and eval_dict.get("relevance") == "PASS"
        and eval_dict.get("groundedness") == "PASS"
        and eval_dict.get("completeness") == "PASS"
        and eval_dict.get("factual_consistency") == "PASS"
    )


def retrieve_chunks(question: str):
    """
    Hybrid retrieval:
    1. Vector search using sentence-transformers
    2. Exact keyword / identifier lookup for regulatory codes (e.g. O.6253, 0.6253, R.8436)
    Filtered strictly to active, approved documents.
    """
    db = SessionLocal()
    approved_filenames = set()
    approved_doc_ids = set()
    try:
        approved_docs = db.query(Document).filter(Document.status == "APPROVED").all()
        for d in approved_docs:
            approved_filenames.add(d.filename)
            approved_doc_ids.add(d.id)
    except Exception as err:
        print(f"[DB Query Error] {err}")
    finally:
        db.close()

    total_chunks = collection.count()
    if total_chunks == 0:
        return [], []

    question_embedding = model.encode(question).tolist()
    question_lower = question.lower()
    broad_terms = [
        "all", "every", "list", "references", "reference", "papers", "paper",
        "mentioned", "document", "documents", "overview", "summary",
        "pass", "passes", "passing", "fail", "fails", "marks", "grade",
        "ordinance", "criteria", "determine", "calculate", "score", "scores"
    ]
    is_broad = any(term in question_lower for term in broad_terms)

    retrieval_k = min(total_chunks, 25 if not is_broad else 35)
    raw_results = collection.query(
        query_embeddings=[question_embedding],
        n_results=retrieval_k,
        include=["documents", "metadatas", "distances"]
    )

    retrieved_chunks = []
    retrieved_sources = []
    seen_snippets = set()

    if raw_results and raw_results.get("documents") and len(raw_results["documents"]) > 0:
        for text, meta in zip(raw_results["documents"][0], raw_results["metadatas"][0]):
            if not meta:
                meta = {}
            doc_name = meta.get("filename", "Document")
            doc_id = meta.get("document_id")

            # Verify document approval
            if approved_filenames and doc_name not in approved_filenames and (doc_id and doc_id not in approved_doc_ids):
                continue

            if text not in seen_snippets:
                seen_snippets.add(text)
                retrieved_chunks.append(text)
                retrieved_sources.append({
                    "document": doc_name,
                    "page": meta.get("page_number", 1),
                    "chunk_index": meta.get("chunk_index", 0),
                    "text": text[:300]
                })

    # Step 3b: Hybrid keyword retrieval for regulatory identifiers
    # Embedding models cannot match codes like "O.6253" / "0.6253" semantically,
    # so we supplement with direct text-contains lookups.
    identifiers = re.findall(r'(?:O\.|0\.|R\.)?\b(\d{4,5})\b', question)
    for ident in identifiers:
        try:
            keyword_results = collection.get(
                where_document={"$contains": ident},
                include=["documents", "metadatas"]
            )
            if keyword_results and keyword_results.get("documents"):
                for text, meta in zip(keyword_results["documents"], keyword_results["metadatas"]):
                    if not meta:
                        meta = {}
                    doc_name = meta.get("filename", "Document")
                    doc_id = meta.get("document_id")
                    if approved_filenames and doc_name not in approved_filenames and (doc_id and doc_id not in approved_doc_ids):
                        continue
                    if text not in seen_snippets:
                        seen_snippets.add(text)
                        retrieved_chunks.append(text)
                        retrieved_sources.append({
                            "document": doc_name,
                            "page": meta.get("page_number", 1),
                            "chunk_index": meta.get("chunk_index", 0),
                            "text": text[:300]
                        })
        except Exception as kw_err:
            print(f"[Keyword Retrieval] Error for '{ident}': {kw_err}")

    return retrieved_chunks, retrieved_sources


def generate_with_retry(prompt: str, max_retries: int = 3) -> str:
    """Generate content with retry and backoff to handle transient 503 spikes."""
    for attempt in range(1, max_retries + 1):
        try:
            response = gemini_client.models.generate_content(
                model=GEMINI_MODEL,
                contents=prompt
            )
            return response.text.strip()
        except Exception as e:
            print(f"[Gemini Generation Attempt {attempt}/{max_retries} Error] {e}")
            if attempt < max_retries:
                time.sleep(2 * attempt)
    return ""


def ask_question(question: str, user_id: str = None, user_email: str = None):
    """
    Adaptive RAG pipeline:
    1. Query classification (GENERAL vs COLLEGE)
    2. Retrieval from active, approved documents only
    3. Initial answer generation
    4. Evaluator assessment across 5 criteria
    5. Adaptive bounded regeneration with targeted critique feedback if hallucinated/unfaithful
    6. Source attribution & database logging for research analytics
    """
    start_time = time.time()
    question = question.strip()

    # Step 1: Classify question
    try:
        category = classify_question(question)
    except Exception as e:
        print(f"[Router Error] {e}")
        category = "COLLEGE"  # Default to document RAG if classification service fails

    print(f"\n[Adaptive RAG] Question: {question}")
    print(f"[Adaptive RAG] Category: {category}")

    # General Question Handler
    if category == "GENERAL":
        prompt = f"""Answer the following question clearly, concisely, and accurately.

Question:
{question}
"""
        try:
            response = gemini_client.models.generate_content(
                model=GEMINI_MODEL,
                contents=prompt
            )
            answer = response.text.strip()
        except Exception as e:
            print(f"[Gemini Error] {e}")
            answer = "I apologize, but I encountered an error while processing your general query."

        latency_ms = round((time.time() - start_time) * 1000, 2)

        # Log query to database
        db = SessionLocal()
        try:
            q_eval = QueryEvaluation(
                user_id=user_id,
                user_email=user_email,
                question=question,
                category="GENERAL",
                initial_answer=answer,
                final_answer=answer,
                regenerated=False,
                regeneration_count=0,
                outcome="PASSED",
                retrieved_sources=json.dumps([]),
                latency_ms=latency_ms,
                created_at=datetime.datetime.now(datetime.timezone.utc)
            )
            db.add(q_eval)
            db.commit()
        except Exception as err:
            print(f"[DB Log Error] {err}")
        finally:
            db.close()

        return {
            "answer": answer,
            "category": "GENERAL",
            "evaluation": None,
            "sources": [],
            "regenerated": False,
            "outcome": "PASSED",
            "latency_ms": latency_ms
        }

    # College / Document Grounded Question Handler
    elif category == "COLLEGE":
        # Step 2 & 3: Retrieval
        retrieved_chunks, retrieved_sources = retrieve_chunks(question)

        # If no approved chunks found
        if not retrieved_chunks:
            latency_ms = round((time.time() - start_time) * 1000, 2)
            answer = "I don't have enough information in the provided documents."
            evaluation = {
                "faithfulness": "PASS",
                "relevance": "PASS",
                "groundedness": "PASS",
                "completeness": "PASS",
                "factual_consistency": "PASS"
            }
            return {
                "answer": answer,
                "category": "COLLEGE",
                "evaluation": evaluation,
                "sources": [],
                "regenerated": False,
                "outcome": "ABSTAINED",
                "latency_ms": latency_ms
            }

        context = "\n\n---\n\n".join(retrieved_chunks)

        # Step 4: Initial generation & adaptive verification loop
        max_attempts = 3
        answer = None
        initial_answer = None
        initial_evaluation = None
        evaluation = None
        regenerated = False
        regeneration_count = 0
        outcome = "UNRESOLVED"

        for attempt in range(1, max_attempts + 1):
            if attempt == 1:
                prompt = f"""You are a college document assistant.
Answer the user's question using ONLY the factual information provided in the context below.

IMPORTANT RULES:
1. Use only information explicitly supported by the context.
2. Do not use outside knowledge or assume missing facts.
3. Understand the user's intent even with informal wording or typos.
4. Answer directly, clearly, and concisely.
5. Apply general institutional rules, ordinances, and assessment standards in the context to specific course scenarios, semesters, or student marks mentioned in the question (such as applying general Engineering ordinances O.6253/R.8436 to individual courses of semester I to VIII).
6. If the context mentions both general rules and specific exceptions (such as passing via combined/total marks), explain both the standard rule and the exception.
7. If the requested information cannot be found in the context, say exactly:
"I don't have enough information in the provided documents."

Context:
{context}

Question:
{question}

Answer:"""
            else:
                regenerated = True
                regeneration_count += 1
                
                # Identify failed criteria for targeted adaptive feedback
                failed_reasons = []
                if evaluation:
                    for crit, status in evaluation.items():
                        if status == "FAIL":
                            failed_reasons.append(crit.replace("_", " ").upper())
                feedback_str = ", ".join(failed_reasons) if failed_reasons else "FAITHFULNESS / GROUNDEDNESS"

                prompt = f"""You are a highly strict college document assistant.
Your previous answer was flagged during AI evaluation for failing the following criteria: {feedback_str}.
It contained statements not fully grounded in or supported by the provided document context.

Generate a corrected, strictly factual answer.

CRITICAL INSTRUCTIONS:
1. Use ONLY information explicitly verified in the context below.
2. REMOVE any speculative, external, or unverified claims.
3. Make sure names, dates, numbers, course rules, and regulations match the context verbatim.
4. Apply general institutional rules, ordinances, and assessment standards in the context to specific course scenarios, semesters, or student marks mentioned in the question (such as applying general Engineering ordinances O.6253/R.8436 to individual courses of semester I to VIII).
5. If the context mentions both general rules and specific exceptions (such as passing via combined/total marks), explain both the standard rule and the exception.
6. If the context does not supply enough specific details to answer the question, say exactly:
"I don't have enough information in the provided documents."

Context:
{context}

Question:
{question}

Previous Answer (FLAGGED AS HALLUCINATED/UNSUPPORTED):
{answer}

Corrected Answer:"""

            generated_text = generate_with_retry(prompt)
            if generated_text:
                answer = generated_text
            else:
                if attempt == 1:
                    answer = "I don't have enough information in the provided documents."

            # Evaluate with evaluator
            evaluation = evaluate_answer(context, question, answer)

            if attempt == 1:
                initial_answer = answer
                initial_evaluation = evaluation

            passed = is_eval_passed(evaluation)

            if passed:
                if "I don't have enough information" in answer:
                    outcome = "ABSTAINED"
                elif attempt > 1:
                    outcome = "CORRECTED"
                else:
                    outcome = "PASSED"
                break

            if attempt == max_attempts:
                # Bounded attempts exhausted; abstain safely to reduce hallucination risk
                answer = "I don't have enough information in the provided documents."
                evaluation = {
                    "faithfulness": "PASS",
                    "relevance": "PASS",
                    "groundedness": "PASS",
                    "completeness": "PASS",
                    "factual_consistency": "PASS"
                }
                outcome = "ABSTAINED"
                break

        latency_ms = round((time.time() - start_time) * 1000, 2)

        # Log query evaluation record into database
        db = SessionLocal()
        try:
            q_eval = QueryEvaluation(
                user_id=user_id,
                user_email=user_email,
                question=question,
                category="COLLEGE",
                initial_answer=initial_answer,
                initial_evaluation=json.dumps(initial_evaluation) if initial_evaluation else None,
                final_answer=answer,
                final_evaluation=json.dumps(evaluation) if evaluation else None,
                regenerated=regenerated,
                regeneration_count=regeneration_count,
                outcome=outcome,
                retrieved_sources=json.dumps(retrieved_sources),
                latency_ms=latency_ms,
                created_at=datetime.datetime.now(datetime.timezone.utc)
            )
            db.add(q_eval)
            db.commit()
        except Exception as err:
            print(f"[DB Log Error] {err}")
        finally:
            db.close()

        return {
            "answer": answer,
            "category": "COLLEGE",
            "evaluation": evaluation,
            "initial_evaluation": initial_evaluation,
            "sources": retrieved_sources,
            "regenerated": regenerated,
            "regeneration_count": regeneration_count,
            "outcome": outcome,
            "latency_ms": latency_ms
        }

    else:
        latency_ms = round((time.time() - start_time) * 1000, 2)
        return {
            "answer": "Unable to classify the question.",
            "category": "UNKNOWN",
            "evaluation": None,
            "sources": [],
            "regenerated": False,
            "outcome": "UNRESOLVED",
            "latency_ms": latency_ms
        }