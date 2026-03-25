import re
from app.core.constants import DEFAULT_CHUNK_SIZE

def chunk_text(text: str, chunk_size: int = DEFAULT_CHUNK_SIZE) -> list[str]:
    words = text.split()
    chunks = []

    for i in range(0, len(words), chunk_size):
        chunk = " ".join(words[i:i + chunk_size])
        chunks.append(chunk)

    return chunks

def split_by_clauses(text: str) -> list[str]:
    try:
        clauses = re.split(r"(Article \d+|Section \d+|Clause \d+)", text)
        return [c.strip() for c in clauses if c.strip()]
    except Exception as e:
        print(f"Error splitting clauses: {e}")
        return []

def smart_chunk(text: str, chunk_size: int = DEFAULT_CHUNK_SIZE) -> list[str]:
    clauses = split_by_clauses(text)

    if len(clauses) <= 1:
        return chunk_text(text, chunk_size)

    chunks = []
    current_words = []

    for clause in clauses:
        clause_words = clause.split()

        if len(current_words) + len(clause_words) <= chunk_size:
            current_words.extend(clause_words)
        else:
            if current_words:
                chunks.append(" ".join(current_words))
            current_words = clause_words

    if current_words:
        chunks.append(" ".join(current_words))

    return chunks