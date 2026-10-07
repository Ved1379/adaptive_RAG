import chromadb
from embeddings import model

client = chromadb.PersistentClient(path="./chroma_data")

collection = client.get_collection(
    name="college_documents"
)

question = "What is the minimum attendance requirement?"

question_embedding = model.encode(question).tolist()

results = collection.query(
    query_embeddings=[question_embedding],
    n_results=3
)

print("Retrieved chunks:")

for document in results["documents"][0]:
    print("\n", document)