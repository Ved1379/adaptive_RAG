
from sentence_transformers import SentenceTransformer
from injestion import extract_text, chunk_text

model = SentenceTransformer("all-MiniLM-L6-v2")

def generate_embeddings(chunks):
    embeddings = model.encode(chunks)
    return embeddings

if __name__ == "__main__":
    text = extract_text("documents/sample.pdf")

    chunks = chunk_text(text)

    embeddings = generate_embeddings(chunks)

    print("Total chunks:", len(chunks))
    print("Total embeddings:", len(embeddings))
    print("Embedding dimensions:", len(embeddings[0]))
    print("\nFirst embedding:")
    print(embeddings[0])