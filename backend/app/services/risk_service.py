import json
import re

from sqlalchemy.orm import Session

from app.ai.openai_client import get_openai_client
from app.core.config import settings
from app.core.constants import RISK_SEVERITIES, RISK_SEVERITY_HIGH, RISK_SEVERITY_MEDIUM, RISK_TYPES, RISK_TYPE_LIABILITY
from app.models.clause import Clause
from app.models.risk import Risk


RISK_PATTERNS = [
    ("liability", "Restrictive or unusual liability language", RISK_SEVERITY_HIGH, r"unlimited liability|liability shall not exceed|consequential damages|indemnif"),
    ("termination", "Termination rights require review", RISK_SEVERITY_MEDIUM, r"terminate|termination|notice"),
    ("renewal", "Renewal terms may require tracking", RISK_SEVERITY_MEDIUM, r"auto.?renew|renewal|successive term"),
    ("payment", "Payment obligation may need review", RISK_SEVERITY_MEDIUM, r"late fee|payment|invoice|interest"),
    ("confidentiality", "Confidentiality terms should be verified", RISK_SEVERITY_MEDIUM, r"confidential|non-disclosure|proprietary"),
]


def _fallback_risks(clauses: list[Clause]) -> list[dict]:
    risks: list[dict] = []
    for clause in clauses:
        text = clause.text or ""
        for risk_type, title, severity, pattern in RISK_PATTERNS:
            if re.search(pattern, text, re.IGNORECASE):
                risks.append({
                    "clause_id": clause.id,
                    "risk_type": risk_type,
                    "severity": severity,
                    "title": title,
                    "explanation": "This clause contains language commonly associated with legal or business risk.",
                    "suggested_action": "Review with counsel and compare against your preferred contract playbook.",
                    "source_snippet": text[:500],
                })
                break
    return risks[:20]


def _ai_risks(contract_text: str) -> list[dict]:
    if not settings.OPENAI_API_KEY:
        return []
    client = get_openai_client()
    safe_text = (contract_text or "")[: settings.AI_MAX_INPUT_CHARS]
    response = client.chat.completions.create(
        model=settings.OPENAI_MODEL,
        timeout=settings.OPENAI_TIMEOUT_SECONDS,
        max_tokens=settings.AI_MAX_OUTPUT_TOKENS,
        response_format={"type": "json_object"},
        messages=[
            {"role": "system", "content": "Extract contract risks. Return JSON only."},
            {"role": "user", "content": "Return {\"risks\":[{\"risk_type\":\"liability|payment|termination|confidentiality|renewal\",\"severity\":\"low|medium|high\",\"title\":\"...\",\"explanation\":\"...\",\"suggested_action\":\"...\",\"source_snippet\":\"...\"}]} for:\n\n" + safe_text},
        ],
    )
    data = json.loads(response.choices[0].message.content or "{}")
    return data.get("risks", []) if isinstance(data.get("risks"), list) else []


def create_or_replace_risks(db: Session, contract_id: int, contract_text: str) -> list[Risk]:
    clauses = db.query(Clause).filter(Clause.contract_id == contract_id).order_by(Clause.order_index).all()
    extracted = _ai_risks(contract_text) or _fallback_risks(clauses)
    db.query(Risk).filter(Risk.contract_id == contract_id).delete()

    risks: list[Risk] = []
    for item in extracted:
        snippet = (item.get("source_snippet") or "")[:1000]
        clause_id = item.get("clause_id")
        if not clause_id and snippet:
            matching_clause = next((c for c in clauses if snippet[:80].lower() in (c.text or "").lower()), None)
            clause_id = matching_clause.id if matching_clause else None

        risk = Risk(
            contract_id=contract_id,
            clause_id=clause_id,
            risk_type=item.get("risk_type") if item.get("risk_type") in RISK_TYPES else RISK_TYPE_LIABILITY,
            severity=item.get("severity") if item.get("severity") in RISK_SEVERITIES else RISK_SEVERITY_MEDIUM,
            title=(item.get("title") or "Contract risk identified")[:255],
            explanation=item.get("explanation"),
            suggested_action=item.get("suggested_action"),
            source_snippet=snippet,
        )
        db.add(risk)
        risks.append(risk)

    db.commit()
    for risk in risks:
        db.refresh(risk)
    return risks
