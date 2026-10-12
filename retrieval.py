
import chromadb
from embeddings import model

client = chromadb.PersistentClient(path="./chroma_data")
collection = client.get_collection(name="college_documents")

question = input("Ask a question: ")

question_embedding = model.encode(question).tolist()

results = collection.query(
    query_embeddings=[question_embedding],
    n_results=7,
    include=["documents", "metadatas", "distances"]
)

print("\nRetrieved sources:")

for i, document in enumerate(results["documents"][0]):
    metadata = results["metadatas"][0][i] or {}

    print(f"\nResult {i + 1}")
    print("Document:", metadata.get("filename", "Unknown"))
    print("Page:", metadata.get("page_number", "Unknown"))
    print("Chunk:", metadata.get("chunk_index", "Unknown"))
    print("Text:", document[:1000])
