import chromadb
from embeddings import generate_embeddings
from injestion import extract_text, chunk_text

client = chromadb.PersistentClient(path="./chroma_data")

collection = client.get_or_create_collection(
    name="college_documents"
)

text = extract_text("documents/sample.pdf")

chunks = chunk_text(text)

embeddings = generate_embeddings(chunks)

collection.add(
    ids=[f"chunk_{i}" for i in range(len(chunks))],
    documents=chunks,
    embeddings=embeddings.tolist()
)

print("Data stored in ChromaDB successfully!")
print("Total chunks:", len(chunks))