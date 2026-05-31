from sqlalchemy.orm import Session

from app.ai.openai_client import get_openai_client
from app.core.config import settings
from app.models.summary import Summary


def _fallback_summary(text: str) -> str:
    sentences = [s.strip() for s in text.replace("\n", " ").split(".") if len(s.strip()) > 30]
    if not sentences:
        return "No readable contract text was available for summarization."
    return ". ".join(sentences[:5])[:2000] + "."


def generate_summary_text(contract_text: str) -> str:
    safe_text = (contract_text or "")[: settings.AI_MAX_INPUT_CHARS]
    if not settings.OPENAI_API_KEY:
        return _fallback_summary(safe_text)

    client = get_openai_client()

    system_prompt = (
        "You are a senior legal analyst writing executive summaries for corporate decision-makers. "
        "Your summaries are read by executives, procurement managers, and legal reviewers who need to "
        "understand a contract in under 30 seconds.\n\n"
        "STRICT OUTPUT FORMAT:\n"
        "- Begin with a single title line that names the agreement type and the parties involved.\n"
        "- Follow with exactly 2 to 4 paragraphs of continuous prose.\n"
        "- Each paragraph should be 2 to 4 sentences.\n"
        "- Do NOT use bullet points, numbered lists, dashes, or asterisks.\n"
        "- Do NOT use markdown headings (##, ###, or similar).\n"
        "- Do NOT use section labels such as 'Parties:', 'Scope:', 'Payment Terms:', "
        "'Governing Law:', 'Liability:', 'Compliance:', or any other labelled section.\n"
        "- Do NOT bold or italicize words using markdown syntax.\n"
        "- Write in fluent, professional business English as continuous paragraphs.\n\n"
        "CONTENT GUIDANCE — weave these naturally into the narrative without creating separate sections:\n"
        "1. Who the parties are and the nature of their relationship.\n"
        "2. What the agreement covers and its primary commercial purpose.\n"
        "3. The contract term, renewal approach, and any termination conditions worth noting.\n"
        "4. Overall business implications and any material concerns (such as auto-renewal risk, "
        "liability exposure, data processing obligations, or compliance requirements) that a "
        "decision-maker should be aware of before approving the agreement.\n\n"
        "Write as if briefing a CFO or General Counsel verbally."
    )

    user_prompt = (
        "Write an executive narrative summary of the following contract. "
        "Output a title on the first line, then 2 to 4 prose paragraphs only. "
        "No headings, no bullets, no markdown, no section labels.\n\n"
        f"{safe_text}"
    )

    response = client.chat.completions.create(
        model=settings.OPENAI_MODEL,
        timeout=settings.OPENAI_TIMEOUT_SECONDS,
        max_tokens=min(settings.AI_MAX_OUTPUT_TOKENS, 700),
        messages=[
            {"role": "system", "content": system_prompt},
            {"role": "user",   "content": user_prompt},
        ],
    )
    return (response.choices[0].message.content or "").strip() or _fallback_summary(safe_text)


def create_or_replace_summary(db: Session, contract_id: int, contract_text: str) -> Summary:
    db.query(Summary).filter(Summary.contract_id == contract_id, Summary.summary_type == "general").delete()
    summary = Summary(
        contract_id=contract_id,
        summary_type="general",
        summary_text=generate_summary_text(contract_text),
    )
    db.add(summary)
    db.commit()
    db.refresh(summary)
    return summary
