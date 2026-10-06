# Adaptive RAG Chatbot

An AI-powered Retrieval-Augmented Generation (RAG) chatbot designed to answer questions using trusted college documents while detecting and reducing hallucinated or unsupported responses.

## 📌 Project Overview

Large Language Models (LLMs) can sometimes generate answers that sound correct but are not supported by the available information.

This project aims to reduce this problem by combining **RAG with AI-based response evaluation**.

The system retrieves relevant information from college documents, provides it to an LLM to generate an answer, and then evaluates the generated response. If the response is weak or unsupported, the system can regenerate the answer using a stricter approach.

## 🔄 System Workflow

```text
College Documents
       ↓
  Text Extraction
       ↓
     Chunking
       ↓
    Embeddings
       ↓
    ChromaDB
       ↓
 Similarity Search
       ↓
Relevant Document Chunks
       ↓
       LLM
       ↓
Generated Answer
       ↓
 Response Evaluator
       ↓
   ┌───────────┐
   │ Evaluation│
   └─────┬─────┘
         │
    ┌────┴────┐
    ↓         ↓
  Pass       Fail
    ↓         ↓
 Response   Regenerate
             ↓
        Evaluate Again