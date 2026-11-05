import sys
import types

import pytest


class _Encoder:
    def encode(self, value, *args, **kwargs):
        return _Vector([0.0] * 384)


class _Vector(list):
    def tolist(self):
        return list(self)


if "embeddings" not in sys.modules:
    test_embeddings = types.ModuleType("embeddings")
    test_embeddings.model = _Encoder()
    test_embeddings.generate_embeddings = lambda texts: None
    sys.modules["embeddings"] = test_embeddings

import rag


class _Doc:
    def __init__(self, doc_id, filename, status="APPROVED"):
        self.id = doc_id
        self.filename = filename
        self.status = status


class _Query:
    def __init__(self, docs):
        self.docs = docs

    def filter(self, *_args):
        return self

    def all(self):
        return [doc for doc in self.docs if doc.status == "APPROVED"]


class _Session:
    def __init__(self, docs):
        self.docs = docs

    def query(self, *_args):
        return _Query(self.docs)

    def close(self):
        pass


class _Collection:
    def __init__(self, vector_rows=(), keyword_rows=(), total=None, reject_filter=False):
        self.vector_rows = list(vector_rows)
        self.keyword_rows = list(keyword_rows)
        self.total = len(self.vector_rows) if total is None else total
        self.reject_filter = reject_filter
        self.query_calls = []
        self.get_calls = []

    def count(self):
        return self.total

    def query(self, **kwargs):
        self.query_calls.append(kwargs)
        if "where" in kwargs and self.reject_filter:
            raise TypeError("where filter unsupported")
        rows = self.vector_rows
        where = kwargs.get("where", {}).get("document_id", {}).get("$in")
        if where is not None:
            rows = [row for row in rows if row[1].get("document_id") in where]
        rows = rows[:kwargs["n_results"]]
        return {
            "documents": [[row[0] for row in rows]],
            "metadatas": [[row[1] for row in rows]],
            "distances": [[row[2] for row in rows]],
        }

    def get(self, **kwargs):
        self.get_calls.append(kwargs)
        if "where" in kwargs and self.reject_filter:
            raise TypeError("combined metadata/text filters unsupported")
        rows = self.keyword_rows
        where = kwargs.get("where", {}).get("document_id", {}).get("$in")
        if where is not None:
            rows = [row for row in rows if row[1].get("document_id") in where]
        contains = kwargs.get("where_document", {}).get("$contains")
        if contains:
            rows = [row for row in rows if contains in row[0]]
        return {
            "documents": [row[0] for row in rows],
            "metadatas": [row[1] for row in rows],
            "ids": [f"chunk-{index}" for index in range(len(rows))],
        }


@pytest.fixture
def retrieval(monkeypatch):
    docs = [
        _Doc("approved-id", "approved.pdf"),
        _Doc("pending-id", "pending.pdf", "PENDING"),
        _Doc("rejected-id", "rejected.pdf", "REJECTED"),
    ]
    collection = _Collection()
    monkeypatch.setattr(rag, "SessionLocal", lambda: _Session(docs))
    monkeypatch.setattr(rag, "collection", collection)
    monkeypatch.setattr(rag.model, "encode", lambda *_args, **_kwargs: _Vector([0.0] * 384))
    return collection


def _row(text, document_id, filename="approved.pdf"):
    metadata = {"filename": filename, "page_number": 1, "chunk_index": 0}
    if document_id is not None:
        metadata["document_id"] = document_id
    return text, metadata, 0.1


def test_vector_retrieval_only_accepts_approved_document_ids(retrieval):
    retrieval.vector_rows = [
        _row("approved content", "approved-id"),
        _row("pending content", "pending-id", "pending.pdf"),
        _row("rejected content", "rejected-id", "rejected.pdf"),
        _row("deleted orphan", "deleted-id", "deleted.pdf"),
        _row("missing id", None),
        _row("empty invalid id", ""),
        _row("non-string invalid id", 123),
        _row("filename and id mismatch", "pending-id", "approved.pdf"),
        _row("approved id with wrong filename", "approved-id", "other.pdf"),
    ]
    retrieval.total = len(retrieval.vector_rows)

    chunks, sources = rag.retrieve_chunks("attendance rule")

    assert chunks == ["approved content", "approved id with wrong filename"]
    assert [source["document"] for source in sources] == ["approved.pdf", "approved.pdf"]
    assert retrieval.query_calls[0]["where"] == {"document_id": {"$in": ["approved-id"]}}


def test_vector_fallback_overfetches_then_filters_before_top_k(retrieval):
    # More than the ordinary top-k of unapproved vectors must not hide an
    # approved result that would be relevant once the invalid rows are removed.
    retrieval.reject_filter = True
    retrieval.vector_rows = [
        *[_row(f"pending {index}", "pending-id", "pending.pdf") for index in range(30)],
        _row("approved survives crowding", "approved-id"),
    ]
    retrieval.total = len(retrieval.vector_rows)

    chunks, _ = rag.retrieve_chunks("attendance rule")

    assert chunks == ["approved survives crowding"]
    assert retrieval.query_calls[1]["n_results"] == retrieval.total


def test_identifier_retrieval_enforces_approved_ids_and_metadata(retrieval):
    retrieval.keyword_rows = [
        _row("Rule 12345 approved", "approved-id"),
        _row("Rule 12345 pending", "pending-id", "pending.pdf"),
        _row("Rule 12345 orphan", "missing-db-id", "orphan.pdf"),
        _row("Rule 12345 no id", None),
        _row("Rule 12345 mismatched filename", "approved-id", "other.pdf"),
    ]
    retrieval.total = len(retrieval.keyword_rows)

    chunks, _ = rag.retrieve_chunks("What is rule 12345?")

    assert "Rule 12345 approved" in chunks
    assert "Rule 12345 mismatched filename" in chunks
    assert all("pending" not in chunk and "orphan" not in chunk and "no id" not in chunk for chunk in chunks)
    assert retrieval.get_calls[0]["where"] == {"document_id": {"$in": ["approved-id"]}}


def test_identifier_fallback_filters_approved_ids_when_combined_filters_unsupported(retrieval):
    retrieval.reject_filter = True
    retrieval.keyword_rows = [
        _row("Rule 54321 approved fallback", "approved-id"),
        _row("Rule 54321 pending fallback", "pending-id", "pending.pdf"),
    ]
    retrieval.total = len(retrieval.keyword_rows)

    chunks, _sources = rag.retrieve_chunks("Look up rule 54321")

    assert chunks == ["Rule 54321 approved fallback"]
    assert len(retrieval.get_calls) == 2
    assert "where" in retrieval.get_calls[0]
    assert "where" not in retrieval.get_calls[1]


def test_no_approved_documents_returns_no_chunks_without_chroma_queries(monkeypatch):
    collection = _Collection(vector_rows=[_row("stale data", "deleted-id")])
    monkeypatch.setattr(rag, "SessionLocal", lambda: _Session([_Doc("pending-id", "pending.pdf", "PENDING")]))
    monkeypatch.setattr(rag, "collection", collection)

    assert rag.retrieve_chunks("attendance rule") == ([], [])
    assert collection.query_calls == []
    assert collection.get_calls == []


def test_deleted_document_chunks_are_orphaned_and_excluded(retrieval):
    retrieval.vector_rows = [_row("deleted record chunks", "deleted-id", "approved.pdf")]
    retrieval.total = 1

    assert rag.retrieve_chunks("attendance rule") == ([], [])


def test_chroma_delete_failure_is_not_reported_as_success(monkeypatch):
    import ingestion_service

    class _BrokenCollection:
        def get(self, **_kwargs):
            return {"ids": ["stale-chunk"]}

        def delete(self, **_kwargs):
            raise RuntimeError("vector store unavailable")

    monkeypatch.setattr(ingestion_service, "collection", _BrokenCollection())
    with pytest.raises(RuntimeError, match="vector store unavailable"):
        ingestion_service.delete_document_from_chroma("approved-id")


def test_gemini_benchmark_baseline_uses_strict_retrieval(monkeypatch):
    from types import SimpleNamespace
    import evaluation_benchmark

    prompts = []
    monkeypatch.setattr(
        evaluation_benchmark,
        "retrieve_chunks",
        lambda _question: (["approved context only"], [{"document": "approved.pdf"}]),
    )
    monkeypatch.setattr(evaluation_benchmark, "evaluate_answer", lambda *_args: {})
    monkeypatch.setattr(
        evaluation_benchmark.gemini_client.models,
        "generate_content",
        lambda **kwargs: (prompts.append(kwargs["contents"]) or SimpleNamespace(text="answer")),
    )

    evaluation_benchmark.run_baseline_rag("question")

    assert "approved context only" in prompts[0]
    assert "pending context" not in prompts[0]

