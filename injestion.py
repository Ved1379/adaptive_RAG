
from pypdf import PdfReader

def extract_text(pdf_path):
    reader = PdfReader(pdf_path)
    text = ""

    for page_number, page in enumerate(reader.pages, start=1):
        page_text = page.extract_text()
        if page_text:
            text += f"\n{page_text}\n"

    return text


def chunk_text(text, chunk_size=500, overlap=100):
    words = text.split()
    chunks = []
    start = 0

    while start < len(words):
        end = start + chunk_size
        chunk = " ".join(words[start:end])
        chunks.append(chunk)
        start += chunk_size - overlap

    return chunks


if __name__ == "__main__":
    text = extract_text("documents/sample.pdf")
    chunks = chunk_text(text)

    print("Extracted characters:", len(text))
    print("Total chunks:", len(chunks))

    for i, chunk in enumerate(chunks[:3], start=1):
        print(f"\nChunk {i}:\n{chunk[:500]}")