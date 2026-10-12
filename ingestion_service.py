import os
import chromadb
from pathlib import Path
from typing import Dict, Any, List
from injestion import extract_pages, chunk_pages
from embeddings import generate_embeddings

# Initialize ChromaDB persistent client
CHROMA_PATH = Path(__file__).resolve().parent / "chroma_data"
chroma_client = chromadb.PersistentClient(path=str(CHROMA_PATH))
collection = chroma_client.get_or_create_collection(name="college_documents")


def ingest_document(document_id: str, file_path: str, filename: str) -> Dict[str, Any]:
    """
    Ingest a PDF document into ChromaDB idempotently.
    Returns: {"success": bool, "page_count": int, "chunk_count": int, "error": str | None}
    """
    try:
        path = Path(file_path)
        if not path.exists():
            return {"success": False, "page_count": 0, "chunk_count": 0, "error": f"File not found: {file_path}"}

        # 1. Extract pages
        pages = extract_pages(str(path))
        if not pages:
            return {"success": False, "page_count": 0, "chunk_count": 0, "error": "No readable text extracted from document."}

        # 2. Chunk pages
        chunks = chunk_pages(pages, chunk_size=250, overlap=50)
        if not chunks:
            return {"success": False, "page_count": len(pages), "chunk_count": 0, "error": "Unable to create chunks from document text."}

        texts = [chunk["text"] for chunk in chunks]

        # 3. Generate embeddings using SentenceTransformer
        embeddings = generate_embeddings(texts)

        # 4. Remove any prior chunks for this document (ensures idempotency on retries)
        try:
            delete_document_from_chroma(document_id)
        except Exception:
            pass

        # 5. Prepare deterministic chunk IDs and metadata
        chunk_ids = [f"doc_{document_id}_chunk_{i}" for i in range(len(chunks))]
        metadatas = [
            {
                "document_id": document_id,
                "filename": filename,
                "page_number": int(chunk["page_number"]),
                "chunk_index": int(i),
            }
            for i, chunk in enumerate(chunks)
        ]

        # 6. Upsert into ChromaDB
        collection.upsert(
            ids=chunk_ids,
            documents=texts,
            embeddings=embeddings.tolist(),
            metadatas=metadatas
        )

        return {
            "success": True,
            "page_count": len(pages),
            "chunk_count": len(chunks),
            "error": None
        }

    except Exception as e:
        return {
            "success": False,
            "page_count": 0,
            "chunk_count": 0,
            "error": str(e)
        }


def delete_document_from_chroma(document_id: str) -> int:
    """
    Remove all chunks belonging to a document from ChromaDB.
    Returns the count of chunks deleted.
    """
    try:
        # ChromaDB allows filtering by metadata
        results = collection.get(where={"document_id": document_id})
        ids_to_delete = results.get("ids", [])
        if ids_to_delete:
            collection.delete(ids=ids_to_delete)
            return len(ids_to_delete)
        return 0
    except Exception as e:
        print(f"[ChromaDB] Error deleting chunks for doc {document_id}: {e}")
        return 0


def get_document_chunks_from_chroma(document_id: str) -> List[Dict[str, Any]]:
    """Retrieve stored chunks and metadata for a specific document."""
    try:
        results = collection.get(
            where={"document_id": document_id},
            include=["documents", "metadatas"]
        )
        chunks = []
        for doc_text, meta in zip(results.get("documents", []), results.get("metadatas", [])):
            chunks.append({
                "page_number": meta.get("page_number", 1),
                "chunk_index": meta.get("chunk_index", 0),
                "text": doc_text
            })
        chunks.sort(key=lambda c: c["chunk_index"])
        return chunks
    except Exception as e:
        print(f"[ChromaDB] Error fetching chunks for doc {document_id}: {e}")
        return []
