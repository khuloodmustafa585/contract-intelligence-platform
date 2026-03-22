from backend.app.utils.file_helpers import read_pdf, read_docx
from backend.app.utils.text_cleaner import preprocess_text
from backend.app.utils.chunking import smart_chunk
import sys
import os

sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "../../")))
# For testing, we’ll just read a text file manually
with open("extra/test_files/test.txt", "r") as f:
    raw_text = f.read()

print("RAW TEXT:\n", raw_text)

# Clean text
cleaned = preprocess_text(raw_text)
print("\nCLEANED TEXT:\n", cleaned)

# Chunk text
chunks = smart_chunk(cleaned)

print("\nCHUNKS:")
for i, chunk in enumerate(chunks, 1):
    print(f"\nChunk {i}:\n{chunk}")