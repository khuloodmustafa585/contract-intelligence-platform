from app.utils.text_cleaner import clean_text, normalize_text, remove_empty_lines, preprocess_text
from app.utils.chunking import chunk_text, split_by_clauses, smart_chunk

sample_text = """
Article 1
This is   a CONTRACT!!!


Article 2
Payment must be made within 30 days.
"""

print("=== TEXT CLEANER TESTS ===")
print(clean_text(sample_text))
print(normalize_text("HELLO WORLD"))
print(remove_empty_lines(sample_text))
print(preprocess_text(sample_text))

print("\n=== CHUNKING TESTS ===")
print(chunk_text("one two three four five six seven eight", chunk_size=3))
print(split_by_clauses(sample_text))
print(smart_chunk(sample_text, chunk_size=10))