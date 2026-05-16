import re
from app.core.constants import DEFAULT_CHUNK_SIZE


def chunk_text(text: str, chunk_size: int = DEFAULT_CHUNK_SIZE) -> list[str]:
    if not text:
        return []
    words = text.split()
    return [" ".join(words[i:i + chunk_size]) for i in range(0, len(words), chunk_size)]


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
    current_words: list[str] = []
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


# Recognises clause boundaries for three heading styles common in legal contracts:
#
#   1.  Numbered with concept title:
#         "8. Termination"  "8.1 Payment Terms"  "1) Definitions"
#
#   2.  Article / Section / Clause / Schedule / Exhibit markers:
#         "Article 5 – Confidentiality"  "Section 3: Governing Law"
#
#   3.  ALL-CAPS standalone headings (US-style contracts):
#         "TERMINATION"  "LIMITATION OF LIABILITY"
#
# The pattern is a NEGATIVE-width lookahead so the heading text itself stays
# attached to the body that follows it — it is NOT consumed by the split.
_HEADING_SPLIT_RE = re.compile(
    r"\n(?="
    r"(?:Article|Section|Clause|Schedule|Exhibit|Appendix)\s+\d"   # Article/Section N
    r"|\d+(?:\.\d+)*[.)]\s+[A-Z]"                                  # 1. Title / 1.2) Title
    r"|[A-Z][A-Z][A-Z ]{1,60}(?:\n|\Z)"                            # ALL-CAPS heading ≥ 3 chars
    r")",
    re.MULTILINE,
)

# Matches the first line of a clause chunk if it looks like a heading.
_IS_HEADING_RE = re.compile(
    r"^(?:"
    r"(?:Article|Section|Clause|Schedule|Exhibit|Appendix)\s+\d"   # Article/Section N
    r"|\d+(?:\.\d+)*[.)]\s+\S"                                     # 1. X / 1.2) X
    r"|[A-Z][A-Z][A-Z ]{1,60}$"                                    # ALL-CAPS heading
    r")",
    re.IGNORECASE | re.MULTILINE,
)


def split_into_clauses(text: str) -> list[str]:
    """
    Split contract text into clause-level chunks, keeping each heading
    attached to the body that follows it.

    Recognised heading formats
    --------------------------
    Numbered with title : "8. Termination"  "8.1 Payment Terms"  "1) Definitions"
    Article/Section     : "Article 5 – Confidentiality"  "Section 3: Governing Law"
    ALL-CAPS            : "TERMINATION"  "LIMITATION OF LIABILITY"
    """
    if not text:
        return []

    parts = _HEADING_SPLIT_RE.split(text)

    cleaned: list[str] = []
    current = ""

    for part in parts:
        part = part.strip()
        if not part:
            continue
        if _IS_HEADING_RE.match(part):
            if current:
                cleaned.append(current.strip())
            current = part
        else:
            current += ("\n" if current else "") + part

    if current:
        cleaned.append(current.strip())

    # Fall back to the whole text as one chunk if nothing was split
    return cleaned if cleaned else [text.strip()]
