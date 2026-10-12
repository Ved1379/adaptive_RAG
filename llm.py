
import os
from pathlib import Path
from dotenv import load_dotenv
from google import genai

# Locate .env in the same folder as this Python file
env_path = Path(__file__).resolve().parent / ".env"

print("Python file:", Path(__file__).resolve())
print(".env path:", env_path)
print(".env exists:", env_path.is_file())

load_dotenv(dotenv_path=env_path, override=True)

api_key = os.getenv("GEMINI_API_KEY")

print("API key loaded:", bool(api_key))
print("API key length:", len(api_key) if api_key else 0)

if not api_key:
    raise ValueError(
        "GEMINI_API_KEY is missing. Check the .env path and variable name."
    )

client = genai.Client(api_key=api_key)
load_dotenv()
response = client.models.generate_content(
    
    model="gemini-3.5-flash-lite",
    contents="Explain what a RAG chatbot is in one sentence."
)

print(response.text)