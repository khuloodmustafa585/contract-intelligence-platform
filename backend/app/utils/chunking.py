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
    clauses = split_into_clauses(text)
    # No clause boundaries detected — fall back to word-count splitting
    if len(clauses) <= 1:
        return chunk_text(text, chunk_size)
    # chunk_size is a ceiling on individual clauses only, never a reason to merge separate clauses
    result = []
    for clause in clauses:
        if len(clause.split()) > chunk_size:
            result.extend(chunk_text(clause, chunk_size))
        else:
            result.append(clause)
    return result


# Named-keyword headings — case-insensitive so "Article", "ARTICLE", "article" all match.
# Two numbered sub-patterns cover both styles:
#   \d+[.)]\s+\S        →  "1. Title"  "1) Title"
#   \d+(?:\.\d+)+\s+\S  →  "1.1 Title"  "2.3 Payment Terms"  (no trailing dot required)
_IS_NAMED_HEADING_RE = re.compile(
    r"^(?:"
    r"(?:Article|Section|Clause|Schedule|Exhibit|Appendix)\s+\d"
    r"|\d+[.)]\s+\S"
    r"|\d+(?:\.\d+)+\s+\S"
    r")",
    re.IGNORECASE,
)

# ALL-CAPS headings — no IGNORECASE so lowercase lines never match.
# Allows digits and common punctuation so "ARTICLE 1", "SECTION 2.1:",
# "LIMITATION OF LIABILITY" are all recognised.
_IS_ALLCAPS_HEADING_RE = re.compile(
    r"^[A-Z]{2}[A-Z0-9 .:-]{1,58}$",
)


def _is_heading(line: str) -> bool:
    """Return True if *line* (already stripped) looks like a clause heading."""
    return bool(
        _IS_NAMED_HEADING_RE.match(line)
        or _IS_ALLCAPS_HEADING_RE.match(line)
    )


def split_into_clauses(text: str) -> list[str]:
    """
    Split contract text into clause-level chunks, keeping each heading
    attached to the body that follows it.

    Works line-by-line so every heading format is evaluated with the same
    two-pattern check (_IS_NAMED_HEADING_RE + _IS_ALLCAPS_HEADING_RE) —
    no regex lookahead that silently misses ARTICLE/SECTION in all-caps.

    Recognised heading formats
    --------------------------
    Numbered with title : "8. Termination"  "8.1 Payment Terms"  "1) Definitions"
    Article/Section     : "Article 5"  "ARTICLE 5"  "Section 3"  "SECTION 3"
    ALL-CAPS            : "TERMINATION"  "LIMITATION OF LIABILITY"  "ARTICLE 1"
    """
    if not text:
        return []

    lines = text.split("\n")
    chunks: list[str] = []
    current: list[str] = []

    for line in lines:
        stripped = line.strip()
        # Start a new clause when a heading line is found and we already have content
        if current and stripped and _is_heading(stripped):
            chunk = "\n".join(current).strip()
            if chunk:
                chunks.append(chunk)
            current = [line]
        else:
            current.append(line)

    if current:
        chunk = "\n".join(current).strip()
        if chunk:
            chunks.append(chunk)

    # Fall back to the whole text as one chunk if nothing was split
    return chunks if chunks else [text.strip()]
