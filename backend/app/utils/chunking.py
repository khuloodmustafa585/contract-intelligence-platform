import re
from backend.app.core.constants import DEFAULT_CHUNK_SIZE

def chunk_text(text: str, chunk_size: int = DEFAULT_CHUNK_SIZE) -> list:
    words = text.split()
    chunks = []

    for i in range(0, len(words), chunk_size):
        chunk = " ".join(words[i:i + chunk_size])
        chunks.append(chunk)

    return chunks

def split_by_clauses(text: str) -> list:
    try:
        clauses = re.split(r"(Article \d+|Section \d+|Clause \d+)", text)
        return [c.strip() for c in clauses if c.strip()]
    
    except Exception as e:
        print(f"Error splitting clauses: {e}")
        return []

def smart_chunk(text: str, chunk_size: int = DEFAULT_CHUNK_SIZE) -> list:
    clauses = split_by_clauses(text)
    chunks = []
    current_chunk = ""

    if len(clauses) <= 1:
        return chunk_text(text, chunk_size)
    for clause in clauses:
        if len(current_chunk) + len(clause) + 1 <= chunk_size:
            if current_chunk:
                current_chunk += " " + clause
            else:
                current_chunk = clause
        else:
            if current_chunk:
                chunks.append(current_chunk.strip())
            current_chunk = clause

    if current_chunk:
        chunks.append(current_chunk.strip())

    return chunks