import os
import json
import time
from dotenv import load_dotenv
from google import genai

load_dotenv()

client = genai.Client(
    api_key=os.getenv("GEMINI_API_KEY")
)


def evaluate_answer(context, question, answer):

    prompt = f"""
You are an expert evaluator for a Retrieval-Augmented Generation
(RAG) chatbot.

Evaluate the generated answer using ONLY the provided context.

CONTEXT:
{context}

QUESTION:
{question}

ANSWER:
{answer}

Evaluate these FIVE criteria:

1. FAITHFULNESS
PASS if the answer is supported by the context.
FAIL if it contains unsupported or hallucinated information.

2. RELEVANCE
PASS if the answer directly addresses the user's question.
FAIL if it does not properly address the question.

3. GROUNDEDNESS
PASS if the answer is grounded in the retrieved context.
FAIL if it relies on unsupported external knowledge.

4. COMPLETENESS
PASS if the answer contains the important information
available in the context that is needed to answer the question.
FAIL if important available information is missing.

5. FACTUAL CONSISTENCY
PASS if the factual claims are consistent with the context.
FAIL if there are factual errors or contradictions.

If the context does not contain enough information to answer
the question, an answer saying:

"I don't have enough information in the provided documents."

should NOT be considered a hallucination.

Return ONLY valid JSON:

{{
    "faithfulness": "PASS",
    "relevance": "PASS",
    "groundedness": "PASS",
    "completeness": "PASS",
    "factual_consistency": "PASS"
}}

Each value must be either PASS or FAIL.
"""

    # Retry Gemini evaluator if the server is temporarily unavailable
    max_retries = 3

    for attempt in range(1, max_retries + 1):

        try:

            response = client.models.generate_content(
                model="gemini-3.5-flash-lite",
                contents=prompt
            )

            result = response.text.strip()

            # Remove markdown code fences
            result = result.replace("```json", "")
            result = result.replace("```", "")
            result = result.strip()

            evaluation = json.loads(result)

            return evaluation

        except Exception as error:

            print(
                f"\nEvaluator Gemini request failed "
                f"(attempt {attempt}/{max_retries})"
            )

            print(error)

            if attempt < max_retries:

                print("Retrying evaluator...")

                time.sleep(3)

            else:

                print(
                    "\nEvaluator could not be reached."
                )

                # Fail safely instead of crashing the whole RAG system
                return {
                    "faithfulness": "FAIL",
                    "relevance": "FAIL",
                    "groundedness": "FAIL",
                    "completeness": "FAIL",
                    "factual_consistency": "FAIL"
                }