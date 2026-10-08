from fastapi import FastAPI, HTTPException
from pydantic import BaseModel

from rag import ask_question


app = FastAPI(
    title="Adaptive RAG Chatbot",
    description="Hallucination Detection and Mitigation",
    version="1.0.0"
)


class ChatRequest(BaseModel):
    question: str


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


@app.post("/chat")
def chat(request: ChatRequest):

    question = request.question.strip()

    if not question:

        raise HTTPException(
            status_code=400,
            detail="Question cannot be empty."
        )


    result = ask_question(question)

    return result