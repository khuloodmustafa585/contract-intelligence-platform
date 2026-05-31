import json
import re
import time
from sqlalchemy.orm import Session

from app.ai.openai_client import get_openai_client
from app.core.config import settings
from app.core.logging import app_logger
from app.models.contract import Contract
from app.services.retrieval_service import search_in_contract

# ── Intent classification ─────────────────────────────────────────────────
#
# Greetings and casual acknowledgements must never trigger RAG.
# Sending "hi" through the full embedding → Qdrant → OpenAI pipeline wastes
# API quota and produces confusing legal-analysis responses for non-questions.

_GREETINGS = frozenset({
    "hi", "hello", "hey", "hiya", "howdy", "greetings", "sup", "yo",
    "good morning", "good afternoon", "good evening", "good day",
})

_CASUAL = frozenset({
    "thanks", "thank you", "ok", "okay", "k", "sure", "cool", "great",
    "got it", "understood", "sounds good", "perfect", "awesome",
    "nice", "good", "alright", "fine", "noted", "cheers",
})


def _classify_input(text: str) -> str:
    """
    Return one of: 'greeting' | 'casual' | 'question'.

    Only 'question' should trigger the full RAG pipeline.
    """
    # Strip punctuation and normalise
    normalized = re.sub(r"[!.?,;:]+", "", text.strip().lower())
    words = normalized.split()

    if not words:
        return "greeting"

    if normalized in _GREETINGS:
        return "greeting"
    if len(words) <= 3 and words[0] in _GREETINGS:
        return "greeting"

    if normalized in _CASUAL:
        return "casual"
    # Short acks that contain only casual words + common filler
    _FILLER = {"you", "for", "the", "so", "very", "much", "a", "that"}
    if len(words) <= 5 and all(w in _CASUAL | _FILLER for w in words):
        return "casual"

    return "question"


# ── System prompt ─────────────────────────────────────────────────────────
#
# This prompt deliberately replaces the former "senior legal analyst" persona
# that auto-generated Risk Impact and Recommended Action on every response.
# The new persona is a focused contract Q&A assistant:
#   - Answers the specific question asked
#   - Quotes the supporting clause
#   - Only adds risk/recommendation when the user's question explicitly
#     asks for them (e.g. "what are the risks", "what should we do")

_SYSTEM_PROMPT = """\
You are a contract Q&A assistant. Your only job is to find and report the exact answer to the user's question from the provided contract clauses.

STRICT RULES:
1. Answer ONLY from the provided clauses. No outside knowledge, no inference beyond what the text explicitly says.
2. Be direct and concise. Write 1–3 sentences for the answer.
3. Quote the exact contract sentence(s) that support your answer verbatim in supporting_clause.
4. If the answer is not in the provided clauses: set answer to "This information was not found in the contract." and supporting_clause to null.
5. Set legal_risk to null UNLESS the user's question explicitly asks about risks, issues, or concerns.
6. Set recommendation to null UNLESS the user's question explicitly asks for advice, recommendations, or what to do.
7. NEVER fabricate numbers, dates, party names, or any detail not in the provided text.
8. Do not pad answers with legal disclaimers or generic compliance notes.

Respond with ONLY this JSON object, no markdown fences:
{
  "answer": "<direct 1–3 sentence answer>",
  "supporting_clause": "<exact verbatim quote from the contract; null if not found>",
  "legal_risk": "<only when explicitly asked about risks; null otherwise>",
  "recommendation": "<only when explicitly asked for advice; null otherwise>"
}\
"""

# ── Confidence hints ──────────────────────────────────────────────────────
# These are passed to the model as context about retrieval quality so it can
# calibrate how assertively to answer.

_CONFIDENCE_HINTS: dict[str, str] = {
    "high":
        "The retrieved clauses are highly relevant. Quote precisely.",
    "moderate":
        "The retrieved clauses are moderately relevant. Use the most applicable text.",
    "low":
        "Retrieval scores are lower than usual. Examine every clause carefully for "
        "ANY content that answers the question — even when phrasing differs "
        "(e.g. 'for a period of twelve months' answers 'how long'). "
        "Only report not-found if truly absent.",
}

_SNIPPET_CHARS = 800


def _parse_response(raw: str) -> dict:
    text = raw.strip()
    if text.startswith("```"):
        lines = text.splitlines()
        end = -1 if lines[-1].strip() == "```" else len(lines)
        text = "\n".join(lines[1:end])
    try:
        data = json.loads(text)
        return {
            "answer":            (data.get("answer")            or "").strip(),
            "supporting_clause": (data.get("supporting_clause") or "").strip() or None,
            "legal_risk":        (data.get("legal_risk")        or "").strip() or None,
            "recommendation":    (data.get("recommendation")    or "").strip() or None,
        }
    except (json.JSONDecodeError, ValueError):
        return {
            "answer":            text,
            "supporting_clause": None,
            "legal_risk":        None,
            "recommendation":    None,
        }


def answer_contract_question(db: Session, contract: Contract, question: str) -> dict:
    t_total = time.monotonic()
    safe_question = question[: settings.AI_MAX_QUESTION_CHARS]

    # ── Step 0: intent classification ──────────────────────────────────────
    intent = _classify_input(safe_question)
    app_logger.info("ask_ai contract_id=%d intent=%r question=%r", contract.id, intent, safe_question[:80])

    if intent == "greeting":
        return {
            "answer":            "Hello! Ask me anything about this contract and I'll find the answer.",
            "supporting_clause": None,
            "legal_risk":        None,
            "recommendation":    None,
            "confidence":        "high",
            "sources":           [],
            "message_type":      "greeting",
        }

    if intent == "casual":
        return {
            "answer":            "Happy to help. What would you like to know about this contract?",
            "supporting_clause": None,
            "legal_risk":        None,
            "recommendation":    None,
            "confidence":        "high",
            "sources":           [],
            "message_type":      "casual",
        }

    # ── Step 1: retrieval ──────────────────────────────────────────────────
    t0 = time.monotonic()
    retrieval = search_in_contract(contract.id, safe_question, db, limit=6)
    sources: list[dict] = retrieval["sources"]
    confidence: str = retrieval["confidence"]
    app_logger.info(
        "ask_ai retrieval: %.3fs  sources=%d  confidence=%s",
        time.monotonic() - t0, len(sources), confidence,
    )

    # ── Step 2: build context ──────────────────────────────────────────────
    context_parts: list[str] = []
    for i, item in enumerate(sources, 1):
        heading = item.get("heading") or ""
        snippet = (item.get("text") or item.get("snippet") or "").strip()[:_SNIPPET_CHARS]
        score   = item.get("rerank_score", item.get("score", 0.0))
        tag     = " [keyword-match]" if item.get("source") == "db_keyword" else ""
        label   = f"[Clause {i}]{f' — {heading}' if heading else ''} (relevance: {score:.2f}{tag})"
        context_parts.append(f"{label}\n{snippet}")
    context = "\n\n".join(context_parts)

    # Zero-retrieval guard: return not-found immediately without an OpenAI call.
    # This prevents the previous bug where the first 3250 chars of the raw
    # contract text were sent as a fallback context, causing hallucinated answers.
    if not context:
        app_logger.warning(
            "ask_ai contract_id=%d: 0 sources retrieved for question=%r",
            contract.id, safe_question[:80],
        )
        return {
            "answer":            "This information was not found in the contract.",
            "supporting_clause": None,
            "legal_risk":        None,
            "recommendation":    None,
            "confidence":        "low",
            "sources":           [],
            "message_type":      "not_found",
        }

    app_logger.info(
        "ask_ai contract_id=%d: calling OpenAI  sources=%d  context_chars=%d  confidence=%s",
        contract.id, len(sources), len(context), confidence,
    )

    if not settings.OPENAI_API_KEY:
        return {
            "answer":            "Configure OPENAI_API_KEY to enable AI-powered contract analysis.",
            "supporting_clause": None,
            "legal_risk":        None,
            "recommendation":    None,
            "confidence":        confidence,
            "sources":           sources,
            "message_type":      "answer",
        }

    # ── Step 3: OpenAI call ────────────────────────────────────────────────
    confidence_hint = _CONFIDENCE_HINTS[confidence]
    client = get_openai_client()
    t0 = time.monotonic()
    response = client.chat.completions.create(
        model=settings.OPENAI_MODEL,
        timeout=settings.OPENAI_TIMEOUT_SECONDS,
        temperature=0.0,
        max_tokens=600,
        response_format={"type": "json_object"},
        messages=[
            {"role": "system", "content": _SYSTEM_PROMPT},
            {
                "role": "user",
                "content": (
                    f"Question: {safe_question}\n\n"
                    f"Retrieval confidence: {confidence_hint}\n\n"
                    f"Retrieved clauses (answer ONLY from these):\n"
                    f"{context[:settings.AI_MAX_INPUT_CHARS]}"
                ),
            },
        ],
    )
    app_logger.info(
        "ask_ai openai: %.3fs  total: %.3fs",
        time.monotonic() - t0,
        time.monotonic() - t_total,
    )

    raw = (response.choices[0].message.content or "").strip()
    parsed = _parse_response(raw)
    parsed["confidence"]   = confidence
    parsed["sources"]      = sources
    parsed["message_type"] = "answer"
    return parsed
