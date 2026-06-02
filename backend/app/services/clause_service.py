import json
import re

from sqlalchemy.orm import Session

from app.ai.openai_client import get_openai_client
from app.ai.prompts.clause_prompt import build_clause_prompt
from app.core.config import settings
from app.core.constants import CLAUSE_CATEGORIES, CLAUSE_CATEGORY_UNCLASSIFIED
from app.core.logging import app_logger
from app.models.clause import Clause
from app.utils.chunking import split_into_clauses

# ── Clause category patterns ───────────────────────────────────────────────
#
# Rules:
#   1. Ordered most-specific → least-specific.  First match wins.
#   2. Data Protection before Confidentiality — GDPR / personal-data clauses
#      often mention "confidential" incidentally.
#   3. Indemnity before Liability — "indemnif" is more precise than "liabilit".
#   4. Intellectual Property before Payment Terms — a "license fee" clause
#      should not be swallowed by the payment pattern.
#   5. Governing Law before Confidentiality — arbitration clauses can mention
#      "confidential proceedings".
#   6. Termination before Term and Duration — "terminat" is distinct from
#      renewal / expiration; checking it first avoids bleed.
#   7. Fallback → CLAUSE_CATEGORY_UNCLASSIFIED (never invents new labels).

_CATEGORY_PATTERNS: list[tuple[re.Pattern, str]] = [
    # Data Protection — GDPR, personal data, data subject/controller are
    # highly specific; match before Confidentiality.
    (re.compile(
        r"personal data|data subject|data controller|data processor"
        r"|gdpr|ccpa|data protection act|privacy policy|privacy notice"
        r"|lawful basis|data processing agreement|dpa\b",
        re.I,
    ), "Data Protection"),

    # Indemnity — must precede Liability so indemnification clauses are not
    # mis-filed under Liability.
    (re.compile(
        r"\bindemnif|\bhold harmless\b|\bindemnitor\b|\bindemnity\b",
        re.I,
    ), "Indemnity"),

    # Intellectual Property — "intellectual property", patents, trademarks,
    # copyright, and ownership of work product.
    (re.compile(
        r"intellectual property|\bpatent\b|\bcopyright\b|trademark"
        r"|\btrade mark\b|\bip rights\b|ownership of.*work|work product"
        r"|proprietary rights|moral rights",
        re.I,
    ), "Intellectual Property"),

    # Governing Law — arbitration and jurisdiction clauses.
    (re.compile(
        r"governing law|applicable law|\bjurisdiction\b|\barbitrat"
        r"|dispute resol|choice of law|courts of|venue clause",
        re.I,
    ), "Governing Law"),

    # Confidentiality — NDA, confidential information, non-disclosure.
    (re.compile(
        r"confidential information|non[- ]?disclosure|\bnda\b"
        r"|confidentiality obligation|duty of confidentiality"
        r"|\bpropriet(?:ary)? information\b",
        re.I,
    ), "Confidentiality"),

    # Termination — checked before Term and Duration to avoid "renewal on
    # termination" bleeding into the wrong category.
    (re.compile(
        r"\bterminat|\bcancell|termination for convenience"
        r"|right to terminate|notice of termination"
        r"|immediate termination|material breach.*terminat"
        r"|terminat.*material breach",
        re.I,
    ), "Termination"),

    # Term and Duration — effective date, commencement, renewal periods,
    # and the length/expiry of the agreement.
    (re.compile(
        r"effective date|commencement date|expiration date"
        r"|initial term|auto[- ]?renew|renewal term"
        r"|\bduration\b|for a term|for a period of"
        r"|evergreen|rollover term",
        re.I,
    ), "Term and Duration"),

    # Liability — limitation of liability, caps, consequential damages.
    (re.compile(
        r"\bliabilit|limitation of liability|consequential damages"
        r"|exclude.*damages|cap on liability|aggregate liability"
        r"|indirect damages|exclude.*loss",
        re.I,
    ), "Liability"),

    # Payment Terms — fees, invoicing, billing, compensation, charges.
    (re.compile(
        r"\bpayment|\binvoice|\bfee\b|\bfees\b|\bbilling\b"
        r"|compensat|\bcharges\b|\bpric|\bremunerat",
        re.I,
    ), "Payment Terms"),
]


def _categorize(heading: str | None, text: str) -> str:
    """
    Map a clause to one of the platform's nine supported categories.
    Returns CLAUSE_CATEGORY_UNCLASSIFIED when no pattern matches —
    never invents a new category name.
    """
    source = (heading or "") + " " + text[:300]
    for pattern, category in _CATEGORY_PATTERNS:
        if pattern.search(source):
            return category
    return CLAUSE_CATEGORY_UNCLASSIFIED


# Numbered / keyword headings — case-insensitive for the keyword portion only.
# Matches:  "Article 5"  "Section 3.1"  "1. Title"  "1.2) Title"
_HEADING_NAMED_RE = re.compile(
    r"^(?:"
    r"(?:Article|Section|Clause|Schedule|Exhibit|Appendix)\s+\d"  # Article/Section N
    r"|\d+(?:\.\d+)*[.)]\s+\S"                                    # 1. X / 1.2) X / 1)
    r")",
    re.IGNORECASE,
)

# ALL-CAPS headings — intentionally NO re.IGNORECASE so lowercase lines never
# match and produce false-positive heading extractions.
# Allows digits and common punctuation so "ARTICLE 1", "SECTION 2.1:",
# "LIMITATION OF LIABILITY" are all recognised.
_HEADING_ALLCAPS_RE = re.compile(r"^[A-Z]{2}[A-Z0-9 .:-]{1,58}$")


def _is_heading_line(line: str) -> bool:
    return bool(_HEADING_NAMED_RE.match(line) or _HEADING_ALLCAPS_RE.match(line))


def extract_heading(text: str) -> tuple[str | None, str]:
    """
    Extract the full heading line from a clause and return (heading, body).

    The heading includes BOTH the section number and the concept title so
    payloads carry meaningful legal labels like "8. Termination" or
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

    if _is_heading_line(first_line) and 0 < len(first_line) <= 200:
        return first_line, rest

    return None, text


_VALID_CATEGORIES = set(CLAUSE_CATEGORIES)


def _ai_extract_clauses(text: str) -> list[dict] | None:
    """
    Call OpenAI to extract structured clause data.  Returns a list of dicts
    with keys {heading, text, category} or None if AI is unavailable / fails.

    Only attempted when text fits within AI_MAX_INPUT_CHARS so the model
    can see the full contract; larger contracts fall back to heuristic splitting.
    """
    if not settings.OPENAI_API_KEY:
        return None
    if len(text) > settings.AI_MAX_INPUT_CHARS:
        app_logger.info(
            "clause extraction: text (%s chars) exceeds AI_MAX_INPUT_CHARS (%s) — using heuristic",
            len(text), settings.AI_MAX_INPUT_CHARS,
        )
        return None
    try:
        client = get_openai_client()
        prompt = build_clause_prompt(text)
        app_logger.info(
            "clause extraction: calling OpenAI model=%s prompt_chars=%s",
            settings.OPENAI_MODEL, len(prompt),
        )
        response = client.chat.completions.create(
            model=settings.OPENAI_MODEL,
            timeout=settings.OPENAI_TIMEOUT_SECONDS,
            max_tokens=settings.AI_MAX_OUTPUT_TOKENS,
            response_format={"type": "json_object"},
            messages=[{"role": "user", "content": prompt}],
        )
        raw = response.choices[0].message.content or ""
        data = json.loads(raw)
        clauses = data.get("clauses") if isinstance(data.get("clauses"), list) else []
        # Filter to entries that have at least a non-empty body text.
        valid = [
            c for c in clauses
            if isinstance(c, dict) and isinstance(c.get("text"), str) and c["text"].strip()
        ]
        app_logger.info("clause extraction: AI returned %s valid clauses", len(valid))
        return valid if valid else None
    except Exception as exc:
        app_logger.warning("clause extraction: AI call failed (%s) — using heuristic", exc)
        return None


def _heuristic_extract_clauses(text: str) -> list[dict]:
    """Split *text* into clause dicts using heading-pattern detection."""
    result = []
    for chunk in split_into_clauses(text):
        heading, body = extract_heading(chunk)
        body_text = body.strip() if body.strip() else chunk.strip()

        # Skip heading-only entries with no body text — these are section-title
        # lines (e.g. "3. PAYMENT TERMS" immediately before "3.1 Fees") and
        # would otherwise store only the heading as the clause body.
        if not body_text or body_text == (heading or "").strip():
            continue

        result.append({"heading": heading, "text": body_text, "category": None})
    return result


def create_clauses(contract_id: int, text: str, db: Session) -> None:
    db.query(Clause).filter(Clause.contract_id == contract_id).delete()
    db.commit()

    # Prefer AI extraction (full context, structured output) and fall back to
    # the heuristic splitter when AI is unavailable or the contract is too large.
    ai_clauses = _ai_extract_clauses(text)
    raw_clauses: list[dict] = ai_clauses if ai_clauses is not None else _heuristic_extract_clauses(text)

    source = "AI" if ai_clauses is not None else "heuristic"
    app_logger.info("clause extraction: %s extracted %s clauses for contract_id=%s", source, len(raw_clauses), contract_id)

    for index, item in enumerate(raw_clauses):
        heading   = (item.get("heading") or "").strip() or None
        body_text = (item.get("text") or "").strip()
        if not body_text:
            continue

        # AI supplies category; heuristic path supplies None — always re-derive
        # so the same patterns apply regardless of which path ran.
        ai_category = item.get("category") or ""
        category = ai_category if ai_category in _VALID_CATEGORIES else _categorize(heading, body_text)

        clause = Clause(
            contract_id=contract_id,
            heading=heading,
            text=body_text,
            order_index=index,
            category=category,
        )
        db.add(clause)

    db.commit()
