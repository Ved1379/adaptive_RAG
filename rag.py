import chromadb
from embeddings import model
from google import genai
import os
from dotenv import load_dotenv

load_dotenv()

# Connect to ChromaDB
client = chromadb.PersistentClient(path="./chroma_data")

collection = client.get_collection(
    name="college_documents"
)

# Connect to Gemini
gemini_client = genai.Client(
    api_key=os.getenv("GEMINI_API_KEY")
)

# Ask the user a question
question = input("Ask a question: ")

# Convert question into an embedding
question_embedding = model.encode(question).tolist()

# Search ChromaDB
results = collection.query(
    query_embeddings=[question_embedding],
    n_results=3
)

# Get the retrieved chunks
retrieved_chunks = results["documents"][0]

# Combine the chunks into one context
context = "\n\n".join(retrieved_chunks)

# Give the context + question to Gemini
prompt = f"""
You are a college document assistant.

Answer the user's question using ONLY the information provided
in the context below.

If the answer cannot be found in the context, say:
"I don't have enough information in the provided documents."

Context:
{context}

Question:
{question}

Answer:
"""

# Generate answer
response = gemini_client.models.generate_content(
    model="gemini-3.5-flash-lite",
    contents=prompt
)

print("\nAnswer:")
print(response.text)