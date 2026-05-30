from sqlalchemy.orm import Session

from app.ai.openai_client import get_openai_client
from app.core.config import settings
from app.core.logging import app_logger
from app.models.summary import Summary


def _fallback_summary(text: str) -> str:
    sentences = [s.strip() for s in text.replace("\n", " ").split(".") if len(s.strip()) > 30]
    if not sentences:
        return "No readable contract text was available for summarization."
    return ". ".join(sentences[:5])[:2000] + "."


def generate_summary_text(contract_text: str) -> str:
    safe_text = (contract_text or "")[: settings.AI_MAX_INPUT_CHARS]
    if not settings.OPENAI_API_KEY:
        app_logger.info("summary generation: OPENAI_API_KEY missing, using fallback")
        return _fallback_summary(safe_text)

    app_logger.info("summary generation: calling OpenAI with %s chars", len(safe_text))
    client = get_openai_client()
    response = client.chat.completions.create(
        model=settings.OPENAI_MODEL,
        timeout=settings.OPENAI_TIMEOUT_SECONDS,
        max_tokens=min(settings.AI_MAX_OUTPUT_TOKENS, 700),
        messages=[
            {"role": "system", "content": "Summarize contracts clearly for business and legal reviewers."},
            {"role": "user", "content": f"Return a concise executive summary of this contract:\n\n{safe_text}"},
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
