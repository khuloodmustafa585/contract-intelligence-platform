import json
import re
from datetime import datetime
from json import JSONDecodeError

from sqlalchemy.orm import Session

from app.ai.openai_client import get_openai_client
from app.core.config import settings
from app.core.logging import app_logger
from app.models.contract import Contract


DATE_PATTERN = re.compile(
    r"\b(20\d{2}-\d{1,2}-\d{1,2}|\d{1,2}/\d{1,2}/20\d{2}|"
    r"(?:January|February|March|April|May|June|July|August|September|October|November|December)"
    r"\s+\d{1,2},\s+20\d{2})\b",
    re.IGNORECASE,
)
JSON_OBJECT_PATTERN = re.compile(r"\{.*\}", re.DOTALL)
NOTICE_PATTERN = re.compile(
    r"\b(\d{1,3})\s*(?:calendar\s+)?days?\b.{0,80}\b(?:notice|prior written notice|written notice)\b|"
    r"\b(?:notice|prior written notice|written notice)\b.{0,80}\b(\d{1,3})\s*(?:calendar\s+)?days?\b",
    re.IGNORECASE | re.DOTALL,
)
METADATA_SCHEMA = {
    "parties": [],
    "contract_type": "",
    "effective_date": "",
    "expiration_date": "",
    "notice_period_days": None,
}

METADATA_SYSTEM_PROMPT = """
You are a contract metadata extraction engine.
Return only valid JSON. Do not include markdown, comments, prose, or code fences.
Extract only facts that are explicitly stated in the contract text.
If a value is not clearly stated, use the empty string for text/date fields and null for notice_period_days.
Dates must be normalized to YYYY-MM-DD when the day, month, and year are available.
If only a partial date is available, leave the field as an empty string.
notice_period_days must be an integer number of days or null.
parties must be an array of party names as strings.
contract_type must be a short lowercase label such as "msa", "nda", "service agreement", "lease", or "".
The response must match exactly this schema:
{
  "parties": [],
  "contract_type": "",
  "effective_date": "",
  "expiration_date": "",
  "notice_period_days": null
}
""".strip()


def _parse_date(value: str | None):
    if not value:
        return None
    value = value.strip()
    for fmt in ("%Y-%m-%d", "%m/%d/%Y", "%d/%m/%Y", "%B %d, %Y"):
        try:
            return datetime.strptime(value, fmt).date()
        except ValueError:
            continue
    return None


def _empty_metadata(source: str) -> dict:
    metadata = dict(METADATA_SCHEMA)
    app_logger.info("metadata extraction: returning empty schema from %s", source)
    return metadata


def _normalize_string(value) -> str:
    if value is None:
        return ""
    value = str(value).strip()
    return "" if value.lower() in {"null", "none", "n/a", "not applicable", "unknown"} else value


def _normalize_date_string(value) -> str:
    value = _normalize_string(value)
    if not value:
        return ""

    parsed = _parse_date(value)
    if parsed:
        return parsed.isoformat()

    if re.fullmatch(r"20\d{2}-\d{2}-\d{2}", value):
        return value
    return ""


def _normalize_parties(value) -> list[str]:
    if not isinstance(value, list):
        return []

    parties = []
    for item in value:
        party = _normalize_string(item)
        if party and party not in parties:
            parties.append(party)
    return parties


def _normalize_metadata(data: dict | None, source: str = "ai") -> dict:
    if not isinstance(data, dict):
        return _empty_metadata(source)

    notice = data.get("notice_period_days")
    try:
        notice = int(notice) if notice not in (None, "") else None
    except (TypeError, ValueError):
        notice = None
    if notice is not None and notice < 0:
        notice = None

    return {
        "parties": _normalize_parties(data.get("parties")),
        "contract_type": _normalize_string(data.get("contract_type")),
        "effective_date": _normalize_date_string(data.get("effective_date")),
        "expiration_date": _normalize_date_string(data.get("expiration_date")),
        "notice_period_days": notice,
    }


def _fallback_metadata(contract_text: str) -> dict:
    dates = DATE_PATTERN.findall(contract_text or "")
    notice_match = NOTICE_PATTERN.search(contract_text or "")
    notice = None
    if notice_match:
        notice = next((group for group in notice_match.groups() if group), None)

    metadata = {
        **METADATA_SCHEMA,
        "effective_date": dates[0] if dates else None,
        "expiration_date": dates[1] if len(dates) > 1 else None,
        "notice_period_days": int(notice) if notice else None,
    }
    return _normalize_metadata(metadata, source="fallback")


def _safe_json_loads(raw_content: str) -> dict:
    content = (raw_content or "").strip()
    if content.startswith("```"):
        content = re.sub(r"^```(?:json)?\s*", "", content, flags=re.IGNORECASE)
        content = re.sub(r"\s*```$", "", content)

    try:
        parsed = json.loads(content)
    except JSONDecodeError:
        match = JSON_OBJECT_PATTERN.search(content)
        if not match:
            raise
        parsed = json.loads(match.group(0))

    if not isinstance(parsed, dict):
        raise ValueError("metadata response was not a JSON object")
    return parsed


def extract_contract_metadata(contract_text: str) -> dict:
    safe_text = (contract_text or "")[: settings.AI_MAX_INPUT_CHARS]
    if not settings.OPENAI_API_KEY:
        app_logger.info("metadata extraction: OPENAI_API_KEY missing, using fallback")
        return _fallback_metadata(safe_text)

    # Metadata extraction runs inside Phase 1 (parsing pipeline).  Any OpenAI
    # error here must NOT propagate — it would cause Phase 1 to delete the
    # contract entirely.  Fall back to regex extraction instead so the contract
    # is always preserved.
    app_logger.info("metadata extraction: calling OpenAI with %s chars", len(safe_text))
    try:
        client = get_openai_client()
        response = client.chat.completions.create(
            model=settings.OPENAI_MODEL,
            timeout=settings.OPENAI_TIMEOUT_SECONDS,
            max_tokens=min(settings.AI_MAX_OUTPUT_TOKENS, 500),
            response_format={"type": "json_object"},
            messages=[
                {
                    "role": "system",
                    "content": METADATA_SYSTEM_PROMPT,
                },
                {
                    "role": "user",
                    "content": (
                        "Extract metadata from this contract and return one JSON object only.\n\n"
                        f"Contract text:\n{safe_text}"
                    ),
                },
            ],
        )
        raw_content = response.choices[0].message.content or "{}"
        app_logger.info("metadata extraction: raw OpenAI response=%s", raw_content[:1000])
        try:
            metadata = _normalize_metadata(_safe_json_loads(raw_content), source="ai")
            app_logger.info("metadata extraction: normalized metadata=%s", metadata)
            return metadata
        except (JSONDecodeError, ValueError, TypeError):
            app_logger.exception("metadata extraction: OpenAI returned malformed JSON, using fallback")
            fallback = _fallback_metadata(safe_text)
            app_logger.info("metadata extraction: fallback after malformed AI JSON=%s", fallback)
            return fallback
    except Exception as exc:
        app_logger.warning(
            "metadata extraction: OpenAI call failed (%s) — using regex fallback so contract is preserved",
            type(exc).__name__,
        )
        return _fallback_metadata(safe_text)


def save_contract_metadata(db: Session, contract: Contract, contract_text: str) -> dict:
    metadata = extract_contract_metadata(contract_text)
    app_logger.info("metadata save: contract id=%s metadata=%s", contract.id, metadata)

    contract.effective_date = _parse_date(metadata.get("effective_date"))
    contract.expiration_date = _parse_date(metadata.get("expiration_date"))
    contract.notice_period_days = metadata.get("notice_period_days")
    contract.extracted_metadata_json = json.dumps(metadata, default=str)

    db.commit()
    db.refresh(contract)
    app_logger.info(
        "metadata save committed: contract id=%s effective_date=%s expiration_date=%s "
        "notice_period_days=%s extracted_metadata_json_set=%s",
        contract.id,
        contract.effective_date,
        contract.expiration_date,
        contract.notice_period_days,
        bool(contract.extracted_metadata_json),
    )
    return metadata
