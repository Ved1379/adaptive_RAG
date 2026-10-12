
import re
from injestion import extract_pages

pages = extract_pages("documents/sample.pdf")
reference_number = 25

pattern = re.compile(
    rf"(?m)^\s*{reference_number}\s+"
)

found = False

for page in pages:
    text = page["text"]

    matches = list(pattern.finditer(text))

    for match in matches:
        start = match.start()
        next_reference = re.search(
            r"(?m)^\s*\d{1,2}\s+",
            text[match.end():]
        )

        end = (
            match.end() + next_reference.start()
            if next_reference
            else len(text)
        )

        print(f"Reference {reference_number} found on page {page['page_number']}:")
        print(text[start:end].strip())
        found = True

if not found:
    print(f"Reference {reference_number} not found in extracted text.")
