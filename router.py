import os
from dotenv import load_dotenv
from google import genai

load_dotenv()

client = genai.Client(
    api_key=os.getenv("GEMINI_API_KEY")
)


def classify_question(question):

    prompt = f"""
You are a question classifier for a college chatbot.

Classify the user's question into exactly one category:

GENERAL
- Normal questions that can be answered using general knowledge.
- Examples: "What is Python?", "What is 1 + 1?", "Explain REST API."

COLLEGE
- Questions specifically asking about the college, its rules,
  departments, courses, exams, attendance, timetable, events,
  facilities, placements, or information that should come from
  college documents.

User question:
{question}

Return ONLY one word:
GENERAL
or
COLLEGE
"""

    response = client.models.generate_content(
        model="gemini-3.5-flash-lite",
        contents=prompt
    )

    return response.text.strip().upper()

if __name__ == "__main__":

    question = input("Ask a question: ")

    result = classify_question(question)

    print("Category:", result)