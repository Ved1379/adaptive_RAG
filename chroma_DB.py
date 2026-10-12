
import chromadb
from embeddings import generate_embeddings
from injestion import extract_pages, chunk_pages

client = chromadb.PersistentClient(path="./chroma_data")

collection = client.get_or_create_collection(
    name="college_documents"
)

pdf_path = "documents/sample.pdf"

pages = extract_pages(pdf_path)
chunks = chunk_pages(pages)

texts = [chunk["text"] for chunk in chunks]
embeddings = generate_embeddings(texts)

collection.upsert(
    ids=[f"sample_pdf_chunk_{i}" for i in range(len(chunks))],
    documents=texts,
    embeddings=embeddings.tolist(),
    metadatas=[
        {
            "filename": "sample.pdf",
            "page_number": chunk["page_number"],
            "chunk_index": i
        }
        for i, chunk in enumerate(chunks)
    ]
)

print("Data stored in ChromaDB successfully!")
print("New chunks processed:", len(chunks))

stored_data = collection.get(
    include=["metadatas"]
)

print("Total chunks in collection:", len(stored_data["ids"]))
print("\nStored metadata:")

for chunk_id, metadata in zip(
    stored_data["ids"],
    stored_data["metadatas"]
):
    print(f"{chunk_id}: {metadata}")
