from fastapi import FastAPI

app = FastAPI(
    title="Adaptive RAG Chatbot",
    description="Hallucination Detection and Mitigation",
    version="1.0.0"
)

@app.get("/")
def home():
    return {
        "message": "Adaptive RAG Chatbot API is running!"
    }

@app.get("/health")
def health():
    return {
        "status": "healthy"
    }