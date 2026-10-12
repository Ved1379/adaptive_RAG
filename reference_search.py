
import re
from injestion import extract_pages


def find_reference(reference_number):
    pages = extract_pages("documents/sample.pdf")
    full_text = "\n".join(page["text"] for page in pages)

    # Find numbered reference headings such as "18 Fine-Refine..."
    pattern = re.compile(
        rf"(?m)^\s*{reference_number}\s+(?=\S)"
    )

    match = pattern.search(full_text)

    if not match:
        return None

    # Find the next numbered reference heading.
    remaining_text = full_text[match.end():]

    next_reference = re.search(
        r"(?m)^\s*\d{1,2}\s+(?=\S)",
        remaining_text
    )

    end = (
        match.end() + next_reference.start()
        if next_reference
        else len(full_text)
    )

    return full_text[match.start():end].strip()


if __name__ == "__main__":
    number = int(input("Enter reference number: "))
    result = find_reference(number)

    if result:
        print(f"\nReference {number}:\n")
        print(result)
    else:
        print(f"Reference {number} was not found.")
