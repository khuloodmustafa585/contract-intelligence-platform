import re
from app.core.constants import DEFAULT_CHUNK_SIZE

def chunk_text(text: str, chunk_size: int = DEFAULT_CHUNK_SIZE) -> list[str]:
    if not text:
        return []

    words = text.split()
    chunks = []

    for i in range(0, len(words), chunk_size):
        chunk = " ".join(words[i:i + chunk_size])
        chunks.append(chunk)

    return chunks

def split_by_clauses(text: str) -> list[str]:
    if not text:
        return []

    pattern = r"(Article\s+\d+|Section\s+\d+|Clause\s+\d+|\d+\.\d+|\d+\.)"
    clauses = re.split(pattern, text)
    return [c.strip() for c in clauses if c.strip()]

def smart_chunk(text: str, chunk_size: int = DEFAULT_CHUNK_SIZE) -> list[str]:
    if not text:
        return []

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

def split_into_clauses(text: str) -> list[str]:
    if not text:
        return []

    pattern = r'\n(?=(Article\s+\d+|Section\s+\d+|Clause\s+\d+|\d+\.\s))'

    clauses = re.split(pattern, text, flags=re.IGNORECASE)

    cleaned = []
    current = ""

    for part in clauses:
        part = part.strip()

        if not part:
            continue

        # If it's a heading, start new clause
        if re.match(r'^(Article|Section|Clause|\d+\.)', part, re.IGNORECASE):
            if current:
                cleaned.append(current.strip())
            current = part
        else:
            current += " " + part

    if current:
        cleaned.append(current.strip())

    return cleaned
