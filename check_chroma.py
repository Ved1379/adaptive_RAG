
import chromadb

client = chromadb.PersistentClient(path="./chroma_data")
collection = client.get_collection(name="college_documents")

data = collection.get(include=["metadatas"])

old_ids = []

for chunk_id, metadata in zip(data["ids"], data["metadatas"]):
    if not metadata or "page_number" not in metadata:
        old_ids.append(chunk_id)

if old_ids:
    collection.delete(ids=old_ids)
    print("Deleted outdated records:", old_ids)
else:
    print("No outdated records found.")

print("Total records remaining:", collection.count())
