from pypdf import PdfReader


def extract_pages(pdf_path):
    """Safely extract text from PDF pages."""
    try:
        reader = PdfReader(pdf_path)
        pages = []

        for page_number, page in enumerate(reader.pages, start=1):
            try:
                page_text = page.extract_text()
                if page_text and page_text.strip():
                    pages.append({
                        "page_number": page_number,
                        "text": page_text.strip()
                    })
            except Exception as page_err:
                print(f"[PDF Extraction Warning] Page {page_number} error: {page_err}")

        return pages
    except Exception as e:
        print(f"[PDF Read Error] Could not read {pdf_path}: {e}")
        return []


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
