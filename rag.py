import chromadb
from embeddings import model
from google import genai
import os
from dotenv import load_dotenv
from evaluator import evaluate_answer
from router import classify_question

load_dotenv()

client = chromadb.PersistentClient(
    path="./chroma_data"
)

collection = client.get_collection(
    name="college_documents"
)

gemini_client = genai.Client(
    api_key=os.getenv("GEMINI_API_KEY")
)


def ask_question(question):

    category = classify_question(question)

    print("\nQuestion type:", category)

    if category == "GENERAL":

        prompt = f"""
Answer the following question clearly and accurately.

Question:
{question}
"""

        response = gemini_client.models.generate_content(
            model="gemini-3.5-flash-lite",
            contents=prompt
        )

        answer = response.text.strip()

        return {
            "answer": answer,
            "category": "GENERAL",
            "evaluation": None,
            "sources": [],
            "regenerated": False
        }

    elif category == "COLLEGE":

        question_embedding = model.encode(
            question
        ).tolist()

        question_lower = question.lower()

        broad_query_terms = [
            "all",
            "every",
            "list",
            "references",
            "reference",
            "papers",
            "paper",
            "mentioned",
            "document",
            "documents",
            "from the document",
            "in the document",
            "according to the document",
            "tell me everything"
        ]

        is_broad_question = any(
            term in question_lower
            for term in broad_query_terms
        )

        if is_broad_question:
            retrieval_count = collection.count()
        else:
            retrieval_count = 3

        results = collection.query(
            query_embeddings=[question_embedding],
            n_results=retrieval_count
        )

        retrieved_chunks = results["documents"][0]

        context = "\n\n".join(retrieved_chunks)

        max_attempts = 3

        answer = None
        evaluation = None
        regenerated = False

        for attempt in range(1, max_attempts + 1):

            print(f"\nGeneration attempt: {attempt}")

            if attempt == 1:

                prompt = f"""
You are a college document assistant.

Answer the user's question using ONLY the information
provided in the context below.

IMPORTANT RULES:

1. Use only information explicitly supported by the context.
2. Do not use outside knowledge.
3. Do not invent information.
4. Do not assume missing information.
5. Understand the user's intent even if the question contains
   spelling mistakes, grammatical mistakes, or informal wording.
6. Answer directly and clearly.
7. If the user asks for information from the document, provide
   information from the retrieved document context.
8. If the requested information cannot be found in the context,
   say exactly:

"I don't have enough information in the provided documents."

Context:
{context}

Question:
{question}

Answer:
"""

            else:

                regenerated = True

                prompt = f"""
You are a highly strict college document assistant.

Your previous answer failed one or more quality checks.

Generate a new and improved answer.

IMPORTANT RULES:

1. Use ONLY information explicitly supported by the context.
2. Do NOT use outside knowledge.
3. Do NOT invent facts.
4. Do NOT assume missing information.
5. Understand the user's intended meaning even if the question
   contains spelling mistakes, grammatical mistakes, or informal wording.
6. Directly answer the user's question.
7. Make sure important information available in the context
   is not omitted.
8. Ensure names, numbers, dates, references and other facts
   match the context exactly.
9. Make sure every factual statement is grounded in the
   retrieved context.
10. If the requested information is not available in the
    context, say exactly:

"I don't have enough information in the provided documents."

Context:
{context}

Question:
{question}

Previous answer:
{answer}

Generate the improved answer:
"""

            response = gemini_client.models.generate_content(
                model="gemini-3.5-flash-lite",
                contents=prompt
            )

            answer = response.text.strip()

            evaluation = evaluate_answer(
                context,
                question,
                answer
            )

            print("\nEvaluation:")
            print(evaluation)

            all_passed = (
                evaluation["faithfulness"] == "PASS"
                and evaluation["relevance"] == "PASS"
                and evaluation["groundedness"] == "PASS"
                and evaluation["completeness"] == "PASS"
                and evaluation["factual_consistency"] == "PASS"
            )

            if all_passed:

                print("\nAnswer:")
                print(answer)

                if "I don't have enough information" in answer:
                    print("\nFinal status: INSUFFICIENT_INFORMATION")
                else:
                    print("\nFinal status: ACCEPTED")

                return {
                    "answer": answer,
                    "category": "COLLEGE",
                    "evaluation": evaluation,
                    "sources": [],
                    "regenerated": regenerated
                }

            if attempt == max_attempts:

                answer = (
                    "I don't have enough information "
                    "in the provided documents."
                )

                print("\nAnswer:")
                print(answer)

                print("\nFinal status: REJECTED")

                return {
                    "answer": answer,
                    "category": "COLLEGE",
                    "evaluation": evaluation,
                    "sources": [],
                    "regenerated": regenerated
                }

            print(
                "\nAnswer failed one or more "
                "evaluation criteria."
            )

            print(
                "Regenerating with a stricter prompt..."
            )

    else:

        return {
            "answer": "Unable to classify the question.",
            "category": "UNKNOWN",
            "evaluation": None,
            "sources": [],
            "regenerated": False
        }


if __name__ == "__main__":

    question = input("Ask a question: ")

    result = ask_question(question)

    print("\nFinal Result:")
    print(result)