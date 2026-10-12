
from pypdf import PdfReader


def extract_pages(pdf_path):
    reader = PdfReader(pdf_path)
    pages = []

    for page_number, page in enumerate(reader.pages, start=1):
        page_text = page.extract_text()

        if page_text:
            pages.append({
                "page_number": page_number,
                "text": page_text
            })

    return pages


def chunk_pages(pages, chunk_size=500, overlap=100):
    chunks = []

    for page in pages:
        words = page["text"].split()
        start = 0

        while start < len(words):
            end = start + chunk_size
            chunk = " ".join(words[start:end])

            chunks.append({
                "text": chunk,
                "page_number": page["page_number"]
            })

            start += chunk_size - overlap

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
