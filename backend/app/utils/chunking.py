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

# Title-case headings — short lines (2-6 words) where every word starts with an
# uppercase letter and the line ends without sentence-final punctuation (.!?:;,).
# This catches "Termination", "Payment Terms", "Governing Law and Jurisdiction"
# without false-positiving on the first sentence of a paragraph.
# Word-count ceiling (≤6) keeps long prose sentences from matching.
_IS_TITLECASE_HEADING_RE = re.compile(
    r"^(?:[A-Z][a-zA-Z]*)(?:\s+(?:[A-Z][a-zA-Z]*)|\s+(?:and|of|the|in|for|to|by))*$"
)
_TITLECASE_MAX_WORDS = 6
_TITLECASE_COMMON_STARTS = frozenset({
    "this", "the", "a", "an", "in", "on", "at", "to", "by", "for",
    "with", "as", "if", "each", "any", "all", "both", "either",
    "neither", "no", "not", "such", "where", "when", "upon",
})


def _is_titlecase_heading(line: str) -> bool:
    """
    Return True if *line* looks like a title-case heading.
    Guards:
    - 1–6 words only (longer = likely a sentence)
    - Every word capitalised (allows lowercase connectors: and/of/the/in/for)
    - Does not start with a common sentence-opening word
    - Does not end with sentence-final punctuation
    """
    if line and line[-1] in ".!?:;,":
        return False
    words = line.split()
    if not words or len(words) > _TITLECASE_MAX_WORDS:
        return False
    if words[0].lower() in _TITLECASE_COMMON_STARTS:
        return False
    # First word must be capitalised; subsequent words may be lowercase connectors
    _connectors = {"and", "of", "the", "in", "for", "to", "by", "or", "at", "a", "an"}
    for i, w in enumerate(words):
        if i == 0:
            if not w[0].isupper():
                return False
        elif w.lower() not in _connectors and not w[0].isupper():
            return False
    return True


def _is_heading(line: str) -> bool:
    """Return True if *line* (already stripped) looks like a clause heading."""
    return bool(
        _IS_NAMED_HEADING_RE.match(line)
        or _IS_ALLCAPS_HEADING_RE.match(line)
        or _is_titlecase_heading(line)
    )


def split_into_clauses(text: str) -> list[str]:
    """
    Split contract text into clause-level chunks, keeping each heading
    attached to the body that follows it.

    Works line-by-line so every heading format is evaluated with the same
    pattern checks — no regex lookahead that silently misses formats.

    Recognised heading formats
    --------------------------
    Numbered with title : "8. Termination"  "8.1 Payment Terms"  "1) Definitions"
    Article/Section     : "Article 5"  "ARTICLE 5"  "Section 3"  "SECTION 3"
    ALL-CAPS            : "TERMINATION"  "LIMITATION OF LIABILITY"  "ARTICLE 1"
    Title-case (≤6 wds) : "Termination"  "Payment Terms"  "Governing Law"
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
