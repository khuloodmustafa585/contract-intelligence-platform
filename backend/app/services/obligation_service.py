import json
import re
from datetime import datetime

from sqlalchemy.orm import Session

from app.ai.openai_client import get_openai_client
from app.core.config import settings
from app.core.constants import OBLIGATION_STATUS_PENDING, OBLIGATION_STATUSES
from app.core.logging import app_logger
from app.models.clause import Clause
from app.models.obligation import Obligation


DATE_PATTERN = re.compile(r"\b(20\d{2}-\d{2}-\d{2}|\d{1,2}/\d{1,2}/20\d{2})\b")


def _parse_date(value: str | None):
    if not value:
        return None
    for fmt in ("%Y-%m-%d", "%m/%d/%Y", "%d/%m/%Y"):
        try:
            return datetime.strptime(value, fmt).date()
        except ValueError:
            continue
    return None


def _fallback_obligations(clauses: list[Clause]) -> list[dict]:
    obligations = []
    markers = ("shall", "must", "required to", "agrees to", "pay", "deliver", "notify")
    for clause in clauses:
        text = clause.text or ""
        if any(marker in text.lower() for marker in markers):
            found_date = DATE_PATTERN.search(text)
            obligations.append({
                "clause_id": clause.id,
                "title": (clause.heading or "Contract obligation")[:255],
                "description": text[:1000],
                "owner": None,
                "due_date": found_date.group(1) if found_date else None,
                "status": OBLIGATION_STATUS_PENDING,
                "source_snippet": text[:500],
            })
    return obligations[:30]


def _ai_obligations(contract_text: str) -> list[dict]:
    if not settings.OPENAI_API_KEY:
        app_logger.info("obligation extraction: OPENAI_API_KEY missing, using fallback")
        return []
    client = get_openai_client()
    safe_text = (contract_text or "")[: settings.AI_MAX_INPUT_CHARS]
    app_logger.info("obligation extraction: calling OpenAI with %s chars", len(safe_text))
    response = client.chat.completions.create(
        model=settings.OPENAI_MODEL,
        timeout=settings.OPENAI_TIMEOUT_SECONDS,
        max_tokens=settings.AI_MAX_OUTPUT_TOKENS,
        response_format={"type": "json_object"},
        messages=[
            {"role": "system", "content": "Extract concrete contract obligations. Return JSON only."},
            {"role": "user", "content": "Return {\"obligations\":[{\"title\":\"...\",\"description\":\"...\",\"owner\":\"party if known\",\"due_date\":\"YYYY-MM-DD or null\",\"status\":\"pending\",\"source_snippet\":\"...\"}]} for:\n\n" + safe_text},
        ],
    )
    data = json.loads(response.choices[0].message.content or "{}")
    obligations = data.get("obligations", []) if isinstance(data.get("obligations"), list) else []
    app_logger.info("obligation extraction: returned %s obligations", len(obligations))
    return obligations


def create_or_replace_obligations(db: Session, contract_id: int, contract_text: str) -> list[Obligation]:
    clauses = db.query(Clause).filter(Clause.contract_id == contract_id).order_by(Clause.order_index).all()
    app_logger.info("contract id=%s obligation extraction: %s clauses available", contract_id, len(clauses))

    ai_results = _ai_obligations(contract_text)
    if ai_results:
        app_logger.info("contract id=%s obligation extraction: AI returned %s raw items", contract_id, len(ai_results))
        extracted = ai_results
    else:
        app_logger.info("contract id=%s obligation extraction: AI empty or unavailable — using regex fallback", contract_id)
        extracted = _fallback_obligations(clauses)
        app_logger.info("contract id=%s obligation extraction: fallback returned %s items", contract_id, len(extracted))

    app_logger.info("contract id=%s obligation extraction returned %s items (before DB insert)", contract_id, len(extracted))
    db.query(Obligation).filter(Obligation.contract_id == contract_id).delete()

    obligations: list[Obligation] = []
    for item in extracted:
        snippet = (item.get("source_snippet") or "")[:1000]
        clause_id = item.get("clause_id")
        if not clause_id and snippet:
            matching_clause = next((c for c in clauses if snippet[:80].lower() in (c.text or "").lower()), None)
            clause_id = matching_clause.id if matching_clause else None

        obligation = Obligation(
            contract_id=contract_id,
            clause_id=clause_id,
            title=(item.get("title") or "Contract obligation")[:255],
            description=item.get("description"),
            owner=item.get("owner"),
            due_date=_parse_date(item.get("due_date")),
            status=item.get("status") if item.get("status") in OBLIGATION_STATUSES else OBLIGATION_STATUS_PENDING,
            source_snippet=snippet,
        )
        db.add(obligation)
        obligations.append(obligation)

    app_logger.info("contract id=%s obligation DB insert count=%s — committing", contract_id, len(obligations))
    db.commit()
    app_logger.info("contract id=%s obligation save committed", contract_id)
    for obligation in obligations:
        db.refresh(obligation)
    return obligations
