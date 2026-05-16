import re
from sqlalchemy.orm import Session

from app.models.clause import Clause
from app.utils.chunking import split_into_clauses

# Matches a line that is a clause heading — either a numbered section that
# includes a concept title, or a standalone ALL-CAPS title.
_HEADING_LINE_RE = re.compile(
    r"^(?:"
    r"(?:Article|Section|Clause|Schedule|Exhibit|Appendix)\s+\d"   # Article/Section N
    r"|\d+(?:\.\d+)*[.)]\s+\S"                                     # 1. X / 1.2) X / 1)
    r"|[A-Z][A-Z][A-Z ]{1,60}$"                                    # ALL-CAPS heading
    r")",
    re.IGNORECASE,
)


def extract_heading(text: str) -> tuple[str | None, str]:
    """
    Extract the full heading line from a clause and return (heading, body).

    The heading includes BOTH the section number and the concept title so
    Qdrant payloads carry meaningful legal labels like "8. Termination" or
    "LIMITATION OF LIABILITY" instead of just "8.".

    Examples
    --------
    "8. Termination\\nEither party may..."  →  ("8. Termination", "Either party may...")
    "TERMINATION\\nEither party may..."     →  ("TERMINATION", "Either party may...")
    "Either party may terminate..."         →  (None, "Either party may terminate...")
    """
    text = text.strip()
    nl = text.find("\n")
    if nl == -1:
        first_line, rest = text, ""
    else:
        first_line, rest = text[:nl].strip(), text[nl + 1:].strip()

    if _HEADING_LINE_RE.match(first_line) and 0 < len(first_line) <= 200:
        # Use the full first line as the heading (concept title included)
        return first_line, rest if rest else ""

    return None, text


def create_clauses(contract_id: int, text: str, db: Session) -> None:
    db.query(Clause).filter(Clause.contract_id == contract_id).delete()
    db.commit()

    clauses = split_into_clauses(text)
    for index, clause_text in enumerate(clauses):
        heading, body = extract_heading(clause_text)
        clause = Clause(
            contract_id=contract_id,
            heading=heading,
            text=body if body else clause_text,
            order_index=index,
        )
        db.add(clause)

    db.commit()
