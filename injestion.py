import os
import re
import shutil
import sys
import tempfile

from pypdf import PdfReader


MIN_MEANINGFUL_ALNUM = 8
MIN_MEANINGFUL_CHARACTERS = 8


class OCRSetupError(RuntimeError):
    """Raised when a document needs OCR but local OCR cannot be initialized."""


class TesseractUnavailableError(OCRSetupError):
    """Raised when a scanned page needs OCR but no local engine is usable."""


class OCRLanguageUnavailableError(OCRSetupError):
    """Raised when Tesseract lacks the language data requested for OCR."""


class OCRProcessingError(OCRSetupError):
    """Raised when the OCR engine fails while processing a scanned page."""


def detect_tesseract_executable(env=None):
    """Find Tesseract from TESSERACT_CMD, PATH, or common install locations."""
    env = os.environ if env is None else env
    configured = (env.get("TESSERACT_CMD") or "").strip().strip('"')
    if configured:
        configured = os.path.expandvars(os.path.expanduser(configured))
        resolved = shutil.which(configured)
        if resolved:
            return os.path.abspath(resolved)
        if os.path.isfile(configured):
            return os.path.abspath(configured)
        return None

    resolved = shutil.which("tesseract") or shutil.which("tesseract.exe")
    if resolved:
        return os.path.abspath(resolved)

    if sys.platform == "win32":
        program_files = [
            env.get("ProgramFiles", r"C:\Program Files"),
            env.get("ProgramFiles(x86)", r"C:\Program Files (x86)"),
            os.path.join(env.get("LOCALAPPDATA", ""), "Programs"),
        ]
        candidates = [
            os.path.join(root, "Tesseract-OCR", "tesseract.exe")
            for root in program_files
            if root
        ]
    elif sys.platform == "darwin":
        candidates = [
            "/opt/homebrew/bin/tesseract",
            "/usr/local/bin/tesseract",
            "/opt/local/bin/tesseract",
        ]
    else:
        candidates = [
            "/usr/bin/tesseract",
            "/usr/local/bin/tesseract",
            "/bin/tesseract",
        ]

    for candidate in candidates:
        if os.path.isfile(candidate) and (sys.platform == "win32" or os.access(candidate, os.X_OK)):
            return os.path.abspath(candidate)
    return None


def configure_tesseract(pytesseract_module, env=None):
    """Configure pytesseract or raise an actionable, non-secret error."""
    executable = detect_tesseract_executable(env=env)
    if not executable:
        configured = (os.environ if env is None else env).get("TESSERACT_CMD")
        if configured:
            raise TesseractUnavailableError(
                f"TESSERACT_CMD does not point to a runnable Tesseract executable: {configured!r}. "
                "Correct the path or unset TESSERACT_CMD."
            )
        raise TesseractUnavailableError(
            "Tesseract OCR was not found. Install the Tesseract engine and English language data, "
            "add it to PATH, or set TESSERACT_CMD to its executable. See README.md under "
            "'Local OCR setup' and run the platform setup script."
        )
    pytesseract_module.pytesseract.tesseract_cmd = executable
    return executable


def validate_ocr_language(pytesseract_module, language="eng"):
    """Fail clearly if Tesseract cannot find the requested traineddata file."""
    try:
        available_languages = pytesseract_module.get_languages(config="")
    except Exception as error:
        raise OCRSetupError(
            "Could not query Tesseract language data. Verify the Tesseract install and "
            "run 'tesseract --list-langs'."
        ) from error
    if language not in available_languages:
        package_hint = (
            "Install English traineddata (for example, 'tesseract-ocr-eng' on Debian/Ubuntu, "
            "or select English in the Windows installer)."
            if language == "eng"
            else f"Install the '{language}' Tesseract traineddata file."
        )
        raise OCRLanguageUnavailableError(
            f"Tesseract language data '{language}' is unavailable. {package_hint} "
            "Then verify with 'tesseract --list-langs'."
        )


def _has_meaningful_text(text):
    """Avoid OCR when pypdf already extracted a readable page body."""
    normalized = re.sub(r"\s+", " ", text or "").strip()
    return (
        len(normalized) >= MIN_MEANINGFUL_CHARACTERS
        and sum(character.isalnum() for character in normalized) >= MIN_MEANINGFUL_ALNUM
    )


def _ocr_page(document, page_index, pytesseract, pymupdf, language):
    """Render one PDF page locally and OCR its temporary PNG with Tesseract."""
    page = document.load_page(page_index)
    pixmap = page.get_pixmap(matrix=pymupdf.Matrix(2.5, 2.5), alpha=False)
    with tempfile.TemporaryDirectory(prefix="adaptive-rag-ocr-") as temp_dir:
        image_path = os.path.join(temp_dir, "page.png")
        pixmap.save(image_path)
        return pytesseract.image_to_string(image_path, lang=language).strip()


def extract_pages(pdf_path, ocr_language="eng", raise_on_ocr_unavailable=False):
    """Extract readable text with pypdf, using local OCR only when needed.

    OCR dependencies are loaded lazily so normal text PDFs continue working
    without PyMuPDF or Tesseract installed. OCR failures are isolated per page.
    Returned page numbers always refer to the original PDF page positions.
    """
    ocr_document = None
    pymupdf = None
    pytesseract = None
    ocr_setup_attempted = False
    ocr_setup_failure = None
    ocr_page_failure = None
    try:
        reader = PdfReader(pdf_path)
        pages = []

        for page_number, page in enumerate(reader.pages, start=1):
            page_text = ""
            try:
                page_text = (page.extract_text() or "").strip()
            except Exception as page_err:
                print(f"[PDF Extraction Warning] Page {page_number} error: {page_err}")

            if _has_meaningful_text(page_text):
                pages.append({"page_number": page_number, "text": page_text})
                continue

            if not ocr_setup_attempted:
                ocr_setup_attempted = True
                try:
                    import pymupdf as pymupdf_module
                    import pytesseract as pytesseract_module

                    pymupdf = pymupdf_module
                    pytesseract = pytesseract_module
                    configure_tesseract(pytesseract)
                    validate_ocr_language(pytesseract, ocr_language)
                    ocr_document = pymupdf.open(pdf_path)
                except Exception as ocr_setup_error:
                    ocr_setup_failure = ocr_setup_error
                    print(
                        f"[OCR Warning] Local OCR setup failed: {ocr_setup_error}"
                    )

            if ocr_document is not None:
                try:
                    ocr_text = _ocr_page(
                        ocr_document, page_number - 1, pytesseract, pymupdf, ocr_language
                    )
                    if _has_meaningful_text(ocr_text):
                        pages.append({"page_number": page_number, "text": ocr_text})
                        continue
                    print(f"[OCR Warning] No readable text detected on page {page_number}.")
                except Exception as ocr_page_error:
                    ocr_page_failure = (page_number, ocr_page_error)
                    print(f"[OCR Warning] Page {page_number} OCR failed: {ocr_page_error}")

            # Keep a small amount of pypdf text if OCR is unavailable or fails;
            # it may still be useful to downstream chunking and can be audited.
            if page_text:
                pages.append({"page_number": page_number, "text": page_text})

        if raise_on_ocr_unavailable and ocr_page_failure:
            page_number, error = ocr_page_failure
            raise OCRProcessingError(f"OCR failed on page {page_number}: {error}") from error
        if raise_on_ocr_unavailable and not pages and ocr_setup_failure:
            if isinstance(ocr_setup_failure, OCRSetupError):
                raise ocr_setup_failure
            raise OCRSetupError(f"OCR setup failed: {ocr_setup_failure}") from ocr_setup_failure
        return pages
    except OCRSetupError:
        raise
    except Exception as e:
        print(f"[PDF Read Error] Could not read {pdf_path}: {e}")
        return []
    finally:
        if ocr_document is not None:
            try:
                ocr_document.close()
            except Exception:
                pass


def chunk_pages(pages, chunk_size=500, overlap=100):
    """Split extracted pages into overlapping chunks."""
    chunks = []

    for page in pages:
        words = page["text"].split()
        if not words:
            continue
            
        start = 0
        while start < len(words):
            end = start + chunk_size
            chunk = " ".join(words[start:end])

            chunks.append({
                "text": chunk,
                "page_number": page["page_number"]
            })

            if end >= len(words):
                break
            start += max(1, chunk_size - overlap)

    return chunks


if __name__ == "__main__":
    pages = extract_pages("documents/sample.pdf")
    chunks = chunk_pages(pages)

    print("Extracted pages:", len(pages))
    print("Total chunks:", len(chunks))

    for i, chunk in enumerate(chunks[:3], start=1):
        print(f"\nChunk {i}")
        print("Page:", chunk["page_number"])
        print(chunk["text"][:500])
