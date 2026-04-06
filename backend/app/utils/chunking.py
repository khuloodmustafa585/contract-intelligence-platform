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

def split_by_clauses(text: str) -> list[dict]:
    if not text:
        return []

    pattern = r"(Article\s+\d+|Section\s+\d+|Clause\s+\d+|\d+\.\d+|\d+\.)\s*"

    matches = list(re.finditer(pattern, text))
    clauses = []

    for i, match in enumerate(matches):
        start = match.start()
        end = matches[i + 1].start() if i + 1 < len(matches) else len(text)

        clause_text = text[start:end].strip()
        clause_title = match.group().strip()

        clauses.append({
            "title": clause_title,
            "text": clause_text
        })

    return clauses

def smart_chunk(text: str, chunk_size: int = DEFAULT_CHUNK_SIZE) -> list[str]:
    if not text:
        return []

    clauses = split_by_clauses(text)

    if len(clauses) <= 1:
        return chunk_text(text, chunk_size)

    chunks = []
    current_chunk = ""
    current_size = 0

    for clause in clauses:
        clause_text = clause["text"]
        clause_length = len(clause_text.split())

        if current_size + clause_length <= chunk_size:
            current_chunk += " " + clause_text
            current_size += clause_length
        else:
            if current_chunk:
                chunks.append(current_chunk.strip())
            current_chunk = clause_text
            current_size = clause_length

    if current_chunk:
        chunks.append(current_chunk.strip())

    return chunks