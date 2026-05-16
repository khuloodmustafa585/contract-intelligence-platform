import json
import time
from sqlalchemy.orm import Session

from app.ai.openai_client import get_openai_client
from app.core.config import settings
from app.core.logging import app_logger
from app.models.contract import Contract
from app.services.retrieval_service import search_in_contract

# System prompt deliberately omits the "not found" template — the LLM should
# always extract the closest available provision rather than surrendering early.
_SYSTEM_PROMPT = """\
You are a senior legal contract analyst for an enterprise legal intelligence platform.

Analyze the retrieved contract clauses and answer the user's question with precise, structured legal interpretation.

RULES
- Base every answer ONLY on the provided clauses. Never fabricate or infer text not present.
- Always find and quote the most relevant provision available, even if it is only partially on-point.
- Acknowledge partial relevance in clause_summary when the match is imperfect — do not suppress the answer.
- Quote exact verbatim contract language. Use ellipsis (…) only to trim genuinely irrelevant portions.
- Write in professional legal-tech language: concise, precise, and actionable.
- Set a field to null ONLY when there is genuinely no retrievable information for it in the context.

Respond with a single valid JSON object, no markdown fences, no extra keys:
{
  "clause_summary": "<1–2 sentence summary of what the retrieved clause covers and its relevance to the question>",
  "quoted_clause": "<exact verbatim excerpt most relevant to the question; null only if context is completely empty>",
  "legal_risk": "<concrete legal or business risk this clause creates; null only if completely inapplicable>",
  "recommendation": "<specific actionable recommendation for the contracting party; null only if genuinely not applicable>"
}\
"""

_CONFIDENCE_HINTS: dict[str, str] = {
    "high":     "The retrieved clauses are highly relevant. Quote precisely and analyze in full.",
    "moderate": "The retrieved clauses are moderately relevant. Extract the most applicable provisions and acknowledge the scope of the match if needed.",
    "low":      "The retrieved clauses have low similarity to the question. Use the closest matching provision available. Note in clause_summary that coverage may be partial, but still provide the best insight possible.",
}

_SNIPPET_CHARS = 450


def _parse_structured(raw: str) -> dict:
    text = raw.strip()
    if text.startswith("```"):
        lines = text.splitlines()
        end = -1 if lines[-1].strip() == "```" else len(lines)
        text = "\n".join(lines[1:end])
    try:
        data = json.loads(text)
        return {
            "clause_summary": (data.get("clause_summary") or "").strip(),
            "quoted_clause":  (data.get("quoted_clause")  or "").strip() or None,
            "legal_risk":     (data.get("legal_risk")     or "").strip() or None,
            "recommendation": (data.get("recommendation") or "").strip() or None,
        }
    except (json.JSONDecodeError, ValueError):
        return {
            "clause_summary": text,
            "quoted_clause":  None,
            "legal_risk":     None,
            "recommendation": None,
        }


def answer_contract_question(db: Session, contract: Contract, question: str) -> dict:
    t_total = time.monotonic()
    safe_question = question[: settings.AI_MAX_QUESTION_CHARS]

    # ── Retrieval ──────────────────────────────────────────────────────────
    t0 = time.monotonic()
    retrieval = search_in_contract(contract.id, safe_question, db, limit=5)
    sources: list[dict] = retrieval["sources"]
    confidence: str = retrieval["confidence"]
    app_logger.info("ask_ai retrieval: %.3fs, %d sources, confidence=%s", time.monotonic() - t0, len(sources), confidence)

    # ── Build context ──────────────────────────────────────────────────────
    context_parts: list[str] = []
    for i, item in enumerate(sources, 1):
        heading = item.get("heading") or ""
        snippet = (item.get("text") or item.get("snippet") or "").strip()[:_SNIPPET_CHARS]
        score   = item.get("rerank_score", item.get("score", 0.0))
        label   = f"[Clause {i}]{f' — {heading}' if heading else ''} (relevance: {score:.2f})"
        context_parts.append(f"{label}\n{snippet}")
    context = "\n\n".join(context_parts)

    # Broad fallback: if vector search yielded nothing, use the contract's
    # cleaned text so the LLM can still attempt an answer.
    if not context:
        context = (contract.cleaned_text or contract.extracted_text or "")[:_SNIPPET_CHARS * 5]
        confidence = "low"
        app_logger.info("ask_ai: no vector hits, falling back to full contract text")

    if not settings.OPENAI_API_KEY:
        return {
            "clause_summary":  "Configure OPENAI_API_KEY to enable AI-powered legal analysis.",
            "quoted_clause":   None,
            "legal_risk":      None,
            "recommendation":  None,
            "confidence":      confidence,
            "sources":         sources,
        }

    # ── OpenAI call ────────────────────────────────────────────────────────
    confidence_hint = _CONFIDENCE_HINTS[confidence]
    client = get_openai_client()
    t0 = time.monotonic()
    response = client.chat.completions.create(
        model=settings.OPENAI_MODEL,
        timeout=settings.OPENAI_TIMEOUT_SECONDS,
        max_tokens=800,
        response_format={"type": "json_object"},
        messages=[
            {"role": "system", "content": _SYSTEM_PROMPT},
            {
                "role": "user",
                "content": (
                    f"Question: {safe_question}\n\n"
                    f"Retrieval note: {confidence_hint}\n\n"
                    f"Retrieved Contract Clauses:\n{context[:settings.AI_MAX_INPUT_CHARS]}\n\n"
                    "Respond with the JSON format specified."
                ),
            },
        ],
    )
    app_logger.info("ask_ai openai: %.3fs", time.monotonic() - t0)
    app_logger.info("ask_ai total:  %.3fs", time.monotonic() - t_total)

    raw = (response.choices[0].message.content or "").strip()
    structured = _parse_structured(raw)
    structured["confidence"] = confidence
    structured["sources"]    = sources
    return structured
