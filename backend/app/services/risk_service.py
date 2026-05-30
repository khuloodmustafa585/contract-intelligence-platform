import json
import re

from sqlalchemy.orm import Session

from app.ai.openai_client import get_openai_client
from app.core.config import settings
from app.core.constants import (
    RISK_SEVERITIES,
    RISK_SEVERITY_HIGH,
    RISK_SEVERITY_MEDIUM,
    RISK_TYPES,
    RISK_TYPE_LIABILITY,
    RISK_TYPE_COMPLIANCE,
)
from app.core.logging import app_logger
from app.models.clause import Clause
from app.models.risk import Risk


# ── Type-based fallback content ───────────────────────────────────────────────
# Used when OpenAI is unavailable (regex fallback path) and as a safety net
# for the AI path if a field is missing from the model response.

_FALLBACK_BUSINESS_IMPACT: dict[str, list[str]] = {
    "liability":            ["Uncapped financial exposure beyond contract value", "Third-party judgment absorption without recourse limit", "Litigation cost liability without proportionate fault allocation"],
    "termination":          ["Unilateral exit without objective performance triggers", "Stranded integration costs on early termination", "Vendor lock-in with no contractual cure or recovery right"],
    "renewal":              ["Automatic extension under potentially outdated commercial terms", "Missed notice windows create binding multi-period commitment", "Renegotiation leverage shifts to counterparty post-rollover"],
    "payment":              ["Cash flow disruption from disputed invoice processing timelines", "Compound penalty accrual erodes projected contract margin", "Unilateral fee adjustment rights create unpredictable budget exposure"],
    "confidentiality":      ["Regulatory disclosure obligations may conflict with clause scope", "Trade secret protection gaps from overly narrow definitions", "Post-termination data handling obligations remain contractually unresolved"],
    "compliance":           ["GDPR and data protection violations from unauthorized cross-border data transfers", "Regulatory penalties in multiple jurisdictions without clear liability allocation", "No data processing agreement protections or adequacy safeguards for international transfers"],
}

_FALLBACK_WHY_THIS_MATTERS: dict[str, str] = {
    "liability":       "Uncapped liability provisions expose your organization to damages well beyond the contract value. Courts may hold you responsible for consequential, incidental, or lost-profit claims not explicitly excluded — a common driver of runaway litigation costs in commercial disputes.",
    "termination":     "Discretionary termination clauses lacking objective trigger criteria give the counterparty the right to exit without meaningful notice or cure periods. This creates vendor lock-in risk on exit, potential data recovery complications, and stranded integration costs with no contractual remedy.",
    "renewal":         "Automatic renewal terms with short notice windows create a recurring obligation trap. Internal calendar gaps frequently result in missed opt-out deadlines, locking your organization into another full contract term under potentially outdated commercial terms.",
    "payment":         "Vague payment timelines, unilateral fee adjustment provisions, or compound late-payment penalties can materially distort cash flow projections and create leverage for the counterparty to extract concessions during the contract lifecycle.",
    "confidentiality": "Overly expansive confidentiality definitions may inadvertently restrict disclosure to regulators, auditors, or investors. Inadequate scope, conversely, may fail to protect trade secrets, customer data, or proprietary methodologies against authorized third-party sharing.",
    "compliance":      "Cross-border data processing provisions without adequate safeguards expose your organization to GDPR, CCPA, and other jurisdictional data protection penalties. Transferring data to countries without equivalent protection frameworks may trigger regulatory investigations and substantial fines, with no contractual remedy against the data processor.",
}

_FALLBACK_TRIGGER_TERMS: dict[str, list[str]] = {
    "liability":       ["unlimited liability", "consequential damages", "aggregate cap", "sole remedy clause"],
    "termination":     ["terminate for convenience", "without cause", "cure period waived", "immediate termination"],
    "renewal":         ["automatic renewal", "evergreen clause", "non-renewal notice", "roll-over term"],
    "payment":         ["late payment penalty", "unilateral fee adjustment", "invoice dispute rights", "payment default"],
    "confidentiality": ["perpetual obligation", "residuals clause", "permitted disclosure", "post-term survival"],
    "compliance":      ["data transfer", "any country", "cross-border transfer", "international jurisdiction"],
}

_DEFAULT_BUSINESS_IMPACT = [
    "Operational exposure from unaddressed contractual risk provisions",
    "Financial liability without adequate protective recourse mechanisms",
    "Legal remedies may be structurally constrained at time of dispute",
]
_DEFAULT_WHY_THIS_MATTERS = (
    "This clause contains language that may create legal or financial risk. "
    "Review with qualified legal counsel before execution."
)
_DEFAULT_TRIGGER_TERMS = ["contractual risk provision", "liability exposure", "unilateral discretion"]


def _fallback_detail(risk_type: str) -> tuple[str, str, str]:
    """Return (business_impact_json, why_this_matters, trigger_terms_json) for the given type."""
    bi  = _FALLBACK_BUSINESS_IMPACT.get(risk_type,  _DEFAULT_BUSINESS_IMPACT)
    wtm = _FALLBACK_WHY_THIS_MATTERS.get(risk_type, _DEFAULT_WHY_THIS_MATTERS)
    tt  = _FALLBACK_TRIGGER_TERMS.get(risk_type,    _DEFAULT_TRIGGER_TERMS)
    return json.dumps(bi), wtm, json.dumps(tt)


# ── Regex fallback path (no OpenAI) ──────────────────────────────────────────
# Specific patterns come first; the loop breaks on first match per clause.

RISK_PATTERNS = [
    # Unlimited liability — specific pattern before generic liability catch-all
    (
        "liability",
        "Unlimited Liability Risk",
        RISK_SEVERITY_HIGH,
        r"unlimited liability|liability shall be unlimited|no limitation of liability"
        r"|uncapped liability|no maximum liability|liability not subject to limitation"
        r"|liability shall not be limited|liability.*without.*(?:cap|limit)",
    ),
    # Cross-border / cross-jurisdiction data processing
    (
        RISK_TYPE_COMPLIANCE,
        "Cross-Border Data Processing Risk",
        RISK_SEVERITY_HIGH,
        r"data.*(?:transfer|process|stor).*any country"
        r"|any country.*data"
        r"|cross.?border.*(?:transfer|data|processing)"
        r"|international.*(?:transfer|data transfer)"
        r"|multiple.*jurisdiction.*data"
        r"|data.*(?:processed|transferred|stored).*(?:any|foreign|abroad|internationally|globally)"
        r"|transfer.*personal data"
        r"|data.*global.*(?:transfer|process|stor)",
    ),
    # Generic liability (consequential damages, indemnification, non-unlimited cap)
    (
        "liability",
        "Restrictive or unusual liability language",
        RISK_SEVERITY_HIGH,
        r"liability shall not exceed|consequential damages|indemnif",
    ),
    ("termination",    "Termination rights require review",         RISK_SEVERITY_MEDIUM, r"terminate|termination|notice"),
    ("renewal",        "Renewal terms may require tracking",        RISK_SEVERITY_MEDIUM, r"auto.?renew|renewal|successive term"),
    ("payment",        "Payment obligation may need review",        RISK_SEVERITY_MEDIUM, r"late fee|payment|invoice|interest"),
    ("confidentiality","Confidentiality terms should be verified",  RISK_SEVERITY_MEDIUM, r"confidential|non-disclosure|proprietary"),
]


def _fallback_risks(clauses: list[Clause]) -> list[dict]:
    risks: list[dict] = []
    for clause in clauses:
        text = clause.text or ""
        for risk_type, title, severity, pattern in RISK_PATTERNS:
            if re.search(pattern, text, re.IGNORECASE):
                bi_json, wtm, tt_json = _fallback_detail(risk_type)
                risks.append({
                    "clause_id":        clause.id,
                    "risk_type":        risk_type,
                    "severity":         severity,
                    "title":            title,
                    "explanation":      "This clause contains language commonly associated with legal or business risk.",
                    "suggested_action": "Review with counsel and compare against your preferred contract playbook.",
                    "source_snippet":   text[:500],
                    "business_impact":  bi_json,
                    "why_this_matters": wtm,
                    "trigger_terms":    tt_json,
                })
                break
    return risks[:20]


# ── Robust JSON parser ───────────────────────────────────────────────────────

def _salvage_risks(text: str) -> list[dict]:
    """
    Extract every fully-closed risk object from a (possibly truncated) JSON string.

    Walks the "risks" array character-by-character tracking brace/string depth,
    collecting each object that reaches depth 0 (i.e. its closing '}' is present).
    Incomplete objects at the end of a truncated response are silently dropped.
    """
    m = re.search(r'"risks"\s*:\s*\[', text)
    if not m:
        return []

    pos = m.end()  # just after the opening '['
    salvaged: list[dict] = []

    while pos < len(text):
        # Skip whitespace and commas between objects
        while pos < len(text) and text[pos] in " \t\n\r,":
            pos += 1

        if pos >= len(text) or text[pos] != "{":
            break  # end of array or truncated before next object starts

        # Scan for the matching closing brace, honouring string escapes
        depth = 0
        in_string = False
        escape_next = False
        start = pos
        end = -1

        for i in range(pos, len(text)):
            ch = text[i]
            if escape_next:
                escape_next = False
                continue
            if ch == "\\" and in_string:
                escape_next = True
                continue
            if ch == '"':
                in_string = not in_string
                continue
            if in_string:
                continue
            if ch == "{":
                depth += 1
            elif ch == "}":
                depth -= 1
                if depth == 0:
                    end = i
                    break

        if end == -1:
            # Object never closed — truncated mid-way, nothing more to salvage
            break

        obj_text = text[start : end + 1]
        try:
            obj = json.loads(obj_text)
            if isinstance(obj, dict):
                salvaged.append(obj)
        except json.JSONDecodeError:
            pass  # malformed object, skip it

        pos = end + 1

    return salvaged


def _parse_ai_json(raw: str | None) -> dict:
    """
    Parse an OpenAI message string into a dict, with two layers of recovery:

    1. Strip markdown code fences then attempt normal json.loads.
    2. On failure, run _salvage_risks() to extract every complete object
       that was written before the response was cut off.
    """
    if not raw:
        return {}

    text = raw.strip()

    # Strip markdown fences: ```json\n...\n``` or ```\n...\n```
    text = re.sub(r"^```(?:json)?\s*", "", text, flags=re.IGNORECASE)
    text = re.sub(r"\s*```$", "", text)
    text = text.strip()

    try:
        return json.loads(text)
    except json.JSONDecodeError as exc:
        app_logger.warning("risk JSON decode failed (%s) — attempting partial salvage", exc)

    salvaged = _salvage_risks(text)
    if salvaged:
        app_logger.info(
            "risk extraction: recovered %s risks from partial JSON (response was truncated)",
            len(salvaged),
        )
        return {"risks": salvaged}

    app_logger.error("risk JSON unrecoverable — returning empty result")
    return {}


# ── AI extraction path ────────────────────────────────────────────────────────

_AI_SYSTEM = (
    "You are a legal risk analysis assistant specialising in commercial contract review. "
    "Extract ALL material risks and return JSON only. "
    "Pay particular attention to: unlimited liability exposure, cross-border data processing, "
    "automatic renewal traps, strict payment penalties, broad termination rights, and confidentiality gaps."
)

_AI_USER_TEMPLATE = """
Return JSON only in the following format:

{{
  "risks": [
    {{
      "risk_type": "liability|payment|termination|confidentiality|renewal|compliance",
      "severity": "low|medium|high",
      "title": "concise risk name specific to this clause",
      "explanation": "2-3 sentence AI analysis specific to this exact clause",
      "suggested_action": "specific recommended action for this clause",
      "source_snippet": "verbatim excerpt from the contract that triggered this risk",
      "business_impact": [
        "bullet 1 specific to this clause",
        "bullet 2",
        "bullet 3"
      ],
      "why_this_matters": "paragraph explaining why THIS specific clause matters legally",
      "trigger_terms": [
        "exact term 1 found in this clause",
        "exact term 2",
        "exact term 3",
        "exact term 4"
      ]
    }}
  ]
}}

Risk detection guidelines — flag ALL of the following when present:

1. UNLIMITED LIABILITY (risk_type: "liability", severity: "high", title: "Unlimited Liability Risk")
   Detect: "unlimited liability", "liability shall be unlimited", "no limitation of liability",
   "uncapped liability", "no maximum liability", "liability not subject to limitation",
   "liability shall not be limited", "provider assumes all liability", "liability without cap",
   or any provision that explicitly removes a cap on damages.

2. CROSS-BORDER DATA PROCESSING (risk_type: "compliance", severity: "high",
   title: "Cross-Border Data Processing Risk")
   Detect: "data may be processed/transferred/stored in any country", "any country",
   "cross-border transfer", "international transfer", "multiple jurisdictions",
   "data stored abroad", "foreign jurisdiction", "transfer personal data",
   "process data globally", or any provision allowing data movement without
   specifying adequate safeguards or adequacy decisions.

3. PAYMENT RISKS (risk_type: "payment", severity: "medium" or "high")
   Detect: late payment penalties, unilateral fee adjustments, short payment windows,
   automatic interest accrual, disputed invoice handling.

4. TERMINATION RISKS (risk_type: "termination", severity: "medium" or "high")
   Detect: termination for convenience, one-sided exit rights, short notice periods,
   no cure periods, immediate termination triggers.

5. RENEWAL RISKS (risk_type: "renewal", severity: "medium")
   Detect: automatic renewal, short opt-out windows, evergreen clauses, roll-over terms.

6. CONFIDENTIALITY RISKS (risk_type: "confidentiality", severity: "medium")
   Detect: overly broad NDA scope, perpetual obligations, inadequate carve-outs,
   third-party disclosure rights.

Do NOT limit detection to only these categories — flag any other material contractual risk.

Contract:

{text}
"""


def _ai_risks(contract_text: str) -> list[dict]:
    if not settings.OPENAI_API_KEY:
        app_logger.info("risk extraction: OPENAI_API_KEY missing, using fallback")
        return []
    client = get_openai_client()
    safe_text = (contract_text or "")[: settings.AI_MAX_INPUT_CHARS]
    app_logger.info(
        "risk extraction: calling OpenAI model=%s max_tokens=%s input_chars=%s",
        settings.OPENAI_MODEL, settings.AI_MAX_OUTPUT_TOKENS, len(safe_text),
    )
    response = client.chat.completions.create(
        model=settings.OPENAI_MODEL,
        timeout=settings.OPENAI_TIMEOUT_SECONDS,
        max_tokens=settings.AI_MAX_OUTPUT_TOKENS,
        response_format={"type": "json_object"},
        messages=[
            {"role": "system", "content": _AI_SYSTEM},
            {"role": "user",   "content": _AI_USER_TEMPLATE.format(text=safe_text)},
        ],
    )
    choice      = response.choices[0]
    raw_content = choice.message.content
    finish      = choice.finish_reason
    usage       = response.usage

    app_logger.info(
        "risk extraction: finish_reason=%s prompt_tokens=%s completion_tokens=%s response_len=%s",
        finish,
        usage.prompt_tokens    if usage else "n/a",
        usage.completion_tokens if usage else "n/a",
        len(raw_content or ""),
    )

    if finish == "length":
        app_logger.warning(
            "risk extraction: TRUNCATED by token limit — "
            "max_tokens=%s completion_tokens=%s — partial salvage will run",
            settings.AI_MAX_OUTPUT_TOKENS,
            usage.completion_tokens if usage else "n/a",
        )

    app_logger.debug("risk extraction: raw response: %r", raw_content)

    data  = _parse_ai_json(raw_content)
    risks = data.get("risks", []) if isinstance(data.get("risks"), list) else []
    app_logger.info("risk extraction: AI risks detected before parsing failure = %s", len(risks))
    return risks


# ── Persistence ───────────────────────────────────────────────────────────────

def create_or_replace_risks(db: Session, contract_id: int, contract_text: str) -> list[Risk]:
    clauses = db.query(Clause).filter(Clause.contract_id == contract_id).order_by(Clause.order_index).all()
    app_logger.info("contract id=%s risk extraction: %s clauses available", contract_id, len(clauses))

    ai_results = _ai_risks(contract_text)
    if ai_results:
        app_logger.info("contract id=%s risk extraction: AI returned %s raw items", contract_id, len(ai_results))
        extracted = ai_results
    else:
        app_logger.info("contract id=%s risk extraction: AI empty or unavailable — using regex fallback", contract_id)
        extracted = _fallback_risks(clauses)
        app_logger.info("contract id=%s risk extraction: fallback returned %s items", contract_id, len(extracted))

    app_logger.info("contract id=%s risk extraction returned %s items (before DB insert)", contract_id, len(extracted))
    db.query(Risk).filter(Risk.contract_id == contract_id).delete()

    risks: list[Risk] = []
    for item in extracted:
        snippet   = (item.get("source_snippet") or "")[:1000]
        clause_id = item.get("clause_id")
        if not clause_id and snippet:
            matching_clause = next((c for c in clauses if snippet[:80].lower() in (c.text or "").lower()), None)
            clause_id = matching_clause.id if matching_clause else None

        risk_type = item.get("risk_type") if item.get("risk_type") in RISK_TYPES else RISK_TYPE_LIABILITY

        # Normalise AI list fields to JSON strings; supply type-based fallback
        # if the model omitted them so every row always has content.
        bi_raw = item.get("business_impact")
        if isinstance(bi_raw, list):
            business_impact_json: str | None = json.dumps(bi_raw)
        elif isinstance(bi_raw, str) and bi_raw.strip():
            business_impact_json = bi_raw  # already serialised or plain text
        else:
            business_impact_json, _, _ = _fallback_detail(risk_type)

        wtm_raw = item.get("why_this_matters")
        if isinstance(wtm_raw, str) and wtm_raw.strip():
            why_this_matters: str | None = wtm_raw
        else:
            _, why_this_matters, _ = _fallback_detail(risk_type)

        tt_raw = item.get("trigger_terms")
        if isinstance(tt_raw, list):
            trigger_terms_json: str | None = json.dumps(tt_raw)
        elif isinstance(tt_raw, str) and tt_raw.strip():
            trigger_terms_json = tt_raw
        else:
            _, _, trigger_terms_json = _fallback_detail(risk_type)

        risk = Risk(
            contract_id     = contract_id,
            clause_id       = clause_id,
            risk_type       = risk_type,
            severity        = item.get("severity") if item.get("severity") in RISK_SEVERITIES else RISK_SEVERITY_MEDIUM,
            title           = (item.get("title") or "Contract risk identified")[:255],
            explanation     = item.get("explanation"),
            suggested_action= item.get("suggested_action"),
            source_snippet  = snippet,
            business_impact = business_impact_json,
            why_this_matters= why_this_matters,
            trigger_terms   = trigger_terms_json,
        )
        db.add(risk)
        risks.append(risk)

    app_logger.info("contract id=%s risk DB insert count=%s — committing", contract_id, len(risks))
    db.commit()
    app_logger.info("contract id=%s risk save committed", contract_id)
    for risk in risks:
        db.refresh(risk)
    return risks
