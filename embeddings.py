
from sentence_transformers import SentenceTransformer

model = SentenceTransformer("all-MiniLM-L6-v2")


def generate_embeddings(chunks):
    embeddings = model.encode(chunks)
    return embeddings


if __name__ == "__main__":
    from injestion import extract_pages, chunk_pages

    pages = extract_pages("documents/sample.pdf")
    chunks = chunk_pages(pages)

    texts = [chunk["text"] for chunk in chunks]
    embeddings = generate_embeddings(texts)

    print("Total chunks:", len(texts))
    print("Total embeddings:", len(embeddings))
    print("Embedding dimensions:", len(embeddings[0]))
