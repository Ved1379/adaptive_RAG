import os
import uuid
import psycopg
from dotenv import load_dotenv

load_dotenv()


def get_connection():
    return psycopg.connect(
        host=os.getenv("DB_HOST"),
        port=os.getenv("DB_PORT"),
        dbname=os.getenv("DB_NAME"),
        user=os.getenv("DB_USER"),
        password=os.getenv("DB_PASSWORD")
    )


def save_document(filename, chunks):
    conn = get_connection()

    document_id = uuid.uuid4()

    with conn.cursor() as cursor:

        cursor.execute(
            """
            INSERT INTO documents (id, filename)
            VALUES (%s, %s)
            """,
            (document_id, filename)
        )

        for index, chunk in enumerate(chunks):

            chunk_id = uuid.uuid4()

            cursor.execute(
                """
                INSERT INTO document_chunks
                (id, document_id, chunk_index, content)
                VALUES (%s, %s, %s, %s)
                """,
                (chunk_id, document_id, index, chunk)
            )

    conn.commit()
    conn.close()

    print("Document and chunks saved successfully!")
    print("Document ID:", document_id)


if __name__ == "__main__":
    test_chunks = [
        "This is the first test chunk.",
        "This is the second test chunk.",
        "This is the third test chunk."
    ]

    save_document("test.pdf", test_chunks)