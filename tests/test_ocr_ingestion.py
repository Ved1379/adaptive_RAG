import os
import sys
import tempfile
import types
from pathlib import Path

import pytest
from pypdf import PdfWriter
from pypdf.generic import (
    DecodedStreamObject,
    DictionaryObject,
    NameObject,
    NumberObject,
)


class _Vector(list):
    def tolist(self):
        return list(self)


class _Encoder:
    def encode(self, *_args, **_kwargs):
        return _Vector([0.0] * 384)


if "embeddings" not in sys.modules:
    test_embeddings = types.ModuleType("embeddings")
    test_embeddings.model = _Encoder()
    test_embeddings.generate_embeddings = lambda texts: _Vector(
        [[0.0] * 384 for _ in texts]
    )
    sys.modules["embeddings"] = test_embeddings


def _attach_text(writer, page, text):
    font = DictionaryObject(
        {
            NameObject("/Type"): NameObject("/Font"),
            NameObject("/Subtype"): NameObject("/Type1"),
            NameObject("/BaseFont"): NameObject("/Helvetica"),
        }
    )
    resources = DictionaryObject(
        {NameObject("/Font"): DictionaryObject({NameObject("/F1"): writer._add_object(font)})}
    )
    page[NameObject("/Resources")] = resources
    stream = DecodedStreamObject()
    stream.set_data(f"BT /F1 12 Tf 72 720 Td ({text}) Tj ET".encode("ascii"))
    page[NameObject("/Contents")] = writer._add_object(stream)


def _attach_image(writer, page):
    image = DecodedStreamObject()
    image.set_data(b"\xff")
    image.update(
        {
            NameObject("/Type"): NameObject("/XObject"),
            NameObject("/Subtype"): NameObject("/Image"),
            NameObject("/Width"): NumberObject(1),
            NameObject("/Height"): NumberObject(1),
            NameObject("/ColorSpace"): NameObject("/DeviceGray"),
            NameObject("/BitsPerComponent"): NumberObject(8),
        }
    )
    page[NameObject("/Resources")] = DictionaryObject(
        {NameObject("/XObject"): DictionaryObject({NameObject("/Im0"): writer._add_object(image)})}
    )
    content = DecodedStreamObject()
    content.set_data(b"q 612 0 0 792 0 0 cm /Im0 Do Q")
    page[NameObject("/Contents")] = writer._add_object(content)


def _make_pdf(path, page_types):
    writer = PdfWriter()
    for page_type in page_types:
        page = writer.add_blank_page(width=612, height=792)
        if page_type == "text":
            _attach_text(writer, page, "The timetable lists room and lecture information.")
        elif page_type == "image":
            _attach_image(writer, page)
    with path.open("wb") as handle:
        writer.write(handle)
    return path


def _install_fake_ocr(monkeypatch, texts_by_page, temp_root, fail=False):
    monkeypatch.setattr(tempfile, "tempdir", str(temp_root))
    import injestion

    monkeypatch.setattr(injestion, "detect_tesseract_executable", lambda env=None: "fake-tesseract")
    class FakePixmap:
        def save(self, path):
            Path(path).write_bytes(b"synthetic rendered page")

    class FakePage:
        def get_pixmap(self, **_kwargs):
            return FakePixmap()

    class FakeDocument:
        def load_page(self, index):
            return FakePage()

        def close(self):
            pass

    pymupdf = types.ModuleType("pymupdf")
    pymupdf.open = lambda _path: FakeDocument()
    pymupdf.Matrix = lambda *_args: object()

    pytesseract = types.ModuleType("pytesseract")
    pytesseract.pytesseract = types.SimpleNamespace(tesseract_cmd=None)
    pytesseract.get_languages = lambda config="": ["eng", "osd"]
    calls = []

    def image_to_string(path, lang):
        calls.append((Path(path).read_bytes(), lang))
        if fail:
            raise RuntimeError("synthetic OCR failure")
        return texts_by_page[len(calls) - 1]

    pytesseract.image_to_string = image_to_string
    monkeypatch.setitem(sys.modules, "pymupdf", pymupdf)
    monkeypatch.setitem(sys.modules, "pytesseract", pytesseract)
    return calls


def test_normal_text_pdf_uses_pypdf_without_ocr(tmp_path, monkeypatch):
    import injestion

    pdf_path = _make_pdf(tmp_path / "text.pdf", ["text"])
    monkeypatch.delitem(sys.modules, "pymupdf", raising=False)
    monkeypatch.delitem(sys.modules, "pytesseract", raising=False)

    pages = injestion.extract_pages(str(pdf_path))

    assert len(pages) == 1
    assert pages[0]["page_number"] == 1
    assert "timetable" in pages[0]["text"]


def test_scanned_image_pdf_uses_local_ocr_and_preserves_page_number(tmp_path, monkeypatch):
    import injestion

    pdf_path = _make_pdf(tmp_path / "scanned.pdf", ["image"])
    calls = _install_fake_ocr(
        monkeypatch, ["Computer Engineering timetable, room 204."], tmp_path
    )

    pages = injestion.extract_pages(str(pdf_path))

    assert pages == [{"page_number": 1, "text": "Computer Engineering timetable, room 204."}]
    assert len(calls) == 1
    assert calls[0][1] == "eng"


def test_mixed_pdf_only_ocr_falls_back_page_and_keeps_original_numbers(tmp_path, monkeypatch):
    import injestion

    pdf_path = _make_pdf(tmp_path / "mixed.pdf", ["text", "image"])
    calls = _install_fake_ocr(
        monkeypatch, ["Scanned page contains lecture schedule and room."], tmp_path
    )

    pages = injestion.extract_pages(str(pdf_path))

    assert [page["page_number"] for page in pages] == [1, 2]
    assert "timetable" in pages[0]["text"]
    assert "Scanned page" in pages[1]["text"]
    assert len(calls) == 1  # The readable pypdf page was not OCRed.


def test_empty_and_unreadable_pdfs_fail_gracefully(tmp_path, monkeypatch):
    import injestion

    blank_path = _make_pdf(tmp_path / "blank.pdf", ["blank"])
    _install_fake_ocr(monkeypatch, [""], tmp_path)
    assert injestion.extract_pages(str(blank_path)) == []

    invalid_path = tmp_path / "invalid.pdf"
    invalid_path.write_bytes(b"not a PDF")
    assert injestion.extract_pages(str(invalid_path)) == []


def test_missing_ocr_dependencies_fail_closed_without_crashing(tmp_path, monkeypatch):
    import builtins
    import injestion

    pdf_path = _make_pdf(tmp_path / "ocr-unavailable.pdf", ["image"])
    original_import = builtins.__import__

    def reject_ocr_import(name, *args, **kwargs):
        if name in {"pymupdf", "pytesseract"}:
            raise ImportError(f"{name} intentionally unavailable in test")
        return original_import(name, *args, **kwargs)

    monkeypatch.setattr(builtins, "__import__", reject_ocr_import)

    assert injestion.extract_pages(str(pdf_path)) == []
    with pytest.raises(RuntimeError, match="OCR setup failed"):
        injestion.extract_pages(str(pdf_path), raise_on_ocr_unavailable=True)


def test_tesseract_detection_uses_path(monkeypatch):
    import injestion

    monkeypatch.delenv("TESSERACT_CMD", raising=False)
    monkeypatch.setattr(injestion.shutil, "which", lambda name: "/usr/bin/tesseract" if name == "tesseract" else None)

    assert injestion.detect_tesseract_executable() == os.path.abspath("/usr/bin/tesseract")


def test_custom_tesseract_command_configures_pytesseract(tmp_path, monkeypatch):
    import injestion

    executable = tmp_path / "custom-tesseract"
    executable.write_text("test executable")
    monkeypatch.setattr(injestion.shutil, "which", lambda _name: None)
    pytesseract = types.SimpleNamespace(pytesseract=types.SimpleNamespace(tesseract_cmd=None))

    resolved = injestion.configure_tesseract(
        pytesseract, env={"TESSERACT_CMD": str(executable)}
    )

    assert resolved == str(executable.resolve())
    assert pytesseract.pytesseract.tesseract_cmd == resolved


def test_standard_windows_install_location_is_detected(tmp_path, monkeypatch):
    import injestion

    executable = tmp_path / "Tesseract-OCR" / "tesseract.exe"
    executable.parent.mkdir()
    executable.write_text("test executable")
    monkeypatch.setattr(injestion.sys, "platform", "win32")
    monkeypatch.setattr(injestion.shutil, "which", lambda _name: None)

    resolved = injestion.detect_tesseract_executable(
        env={"ProgramFiles": str(tmp_path), "ProgramFiles(x86)": "", "LOCALAPPDATA": ""}
    )

    assert resolved == str(executable.resolve())


@pytest.mark.parametrize(
    ("platform", "candidate"),
    [
        ("linux", "/usr/local/bin/tesseract"),
        ("darwin", "/opt/homebrew/bin/tesseract"),
    ],
)
def test_standard_unix_install_locations_are_detected(monkeypatch, platform, candidate):
    import injestion

    monkeypatch.setattr(injestion.sys, "platform", platform)
    monkeypatch.setattr(injestion.shutil, "which", lambda _name: None)
    monkeypatch.setattr(injestion.os.path, "isfile", lambda path: path == candidate)
    monkeypatch.setattr(injestion.os, "access", lambda _path, _mode: True)

    assert injestion.detect_tesseract_executable(env={}) == os.path.abspath(candidate)


def test_missing_tesseract_has_actionable_error(monkeypatch):
    import injestion

    monkeypatch.delenv("TESSERACT_CMD", raising=False)
    monkeypatch.setattr(injestion.shutil, "which", lambda _name: None)
    monkeypatch.setattr(injestion.sys, "platform", "linux")
    monkeypatch.setattr(injestion.os.path, "isfile", lambda _path: False)
    pytesseract = types.SimpleNamespace(pytesseract=types.SimpleNamespace(tesseract_cmd=None))

    with pytest.raises(RuntimeError, match="Tesseract OCR was not found"):
        injestion.configure_tesseract(pytesseract)


def test_scanned_pdf_reports_missing_english_traineddata(tmp_path, monkeypatch):
    import injestion

    pdf_path = _make_pdf(tmp_path / "missing-eng.pdf", ["image"])
    _install_fake_ocr(monkeypatch, ["unused"], tmp_path)
    import pytesseract

    monkeypatch.setattr(pytesseract, "get_languages", lambda config="": ["osd"])

    with pytest.raises(injestion.OCRLanguageUnavailableError, match="English traineddata"):
        injestion.extract_pages(str(pdf_path), raise_on_ocr_unavailable=True)

    import ingestion_service

    result = ingestion_service.ingest_document("ocr-missing-eng", str(pdf_path), "missing-eng.pdf")
    assert result["success"] is False
    assert "Tesseract language data 'eng' is unavailable" in result["error"]
    assert "No readable text extracted" not in result["error"]


def test_ocr_failure_is_reported_to_ingestion_without_aborting_text_pages(tmp_path, monkeypatch):
    import injestion

    pdf_path = _make_pdf(tmp_path / "ocr-failure.pdf", ["text", "image"])
    _install_fake_ocr(monkeypatch, [""], tmp_path, fail=True)

    pages = injestion.extract_pages(str(pdf_path))

    assert len(pages) == 1
    assert pages[0]["page_number"] == 1
    with pytest.raises(injestion.OCRProcessingError, match="OCR failed on page 2"):
        injestion.extract_pages(str(pdf_path), raise_on_ocr_unavailable=True)


def test_ocr_text_flows_through_existing_ingestion_and_approved_retrieval(tmp_path, monkeypatch):
    import ingestion_service
    import rag
    from models import Document

    pdf_path = _make_pdf(tmp_path / "ocr-ingest.pdf", ["image"])
    _install_fake_ocr(
        monkeypatch, ["BE COMP lecture timetable: Monday room 302."], tmp_path
    )

    class FakeCollection:
        def __init__(self):
            self.documents = []
            self.metadatas = []

        def upsert(self, ids, documents, embeddings, metadatas):
            self.documents = documents
            self.metadatas = metadatas

        def count(self):
            return len(self.documents)

        def query(self, **_kwargs):
            return {
                "documents": [self.documents],
                "metadatas": [self.metadatas],
                "distances": [[0.1] * len(self.documents)],
            }

        def get(self, **_kwargs):
            return {"documents": [], "metadatas": []}

    collection = FakeCollection()
    monkeypatch.setattr(ingestion_service, "collection", collection)
    monkeypatch.setattr(ingestion_service, "delete_document_from_chroma", lambda _id: 0)
    monkeypatch.setattr(
        ingestion_service,
        "generate_embeddings",
        lambda texts: _Vector([[0.0] * 384 for _ in texts]),
    )

    result = ingestion_service.ingest_document("ocr-doc-id", str(pdf_path), "timetable.pdf")

    assert result["success"] is True
    assert collection.metadatas[0]["document_id"] == "ocr-doc-id"
    assert collection.metadatas[0]["page_number"] == 1
    assert "BE COMP lecture timetable" in collection.documents[0]

    class FakeQuery:
        def filter(self, *_args):
            return self

        def all(self):
            return [Document(id="ocr-doc-id", filename="timetable.pdf", status="APPROVED")]

    class FakeSession:
        def query(self, *_args):
            return FakeQuery()

        def close(self):
            pass

    monkeypatch.setattr(rag, "SessionLocal", FakeSession)
    monkeypatch.setattr(rag, "collection", collection)
    monkeypatch.setattr(rag.model, "encode", lambda *_args: _Vector([0.0] * 384))

    chunks, sources = rag.retrieve_chunks("What is on the BE COMP timetable?")

    assert len(chunks) == 1
    assert "BE COMP lecture timetable" in chunks[0]
    assert sources[0]["document"] == "timetable.pdf"
    assert sources[0]["page"] == 1
