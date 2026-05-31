from sqlalchemy.orm import Session

from app.ai.openai_client import get_openai_client
from app.core.config import settings
from app.models.contract import Contract
from app.services.retrieval_service import search_in_contract


def answer_contract_question(db: Session, contract: Contract, question: str) -> dict:
    safe_question = question[: settings.AI_MAX_QUESTION_CHARS]
    sources = search_in_contract(contract.id, safe_question, db)[:5]
    context = "\n\n".join(f"Clause {item['clause_id']}: {item.get('text') or item.get('snippet')}" for item in sources)

    if not context:
        context = (contract.cleaned_text or contract.extracted_text or "")[: settings.AI_MAX_INPUT_CHARS]

    if not settings.OPENAI_API_KEY:
        answer = "I found the most relevant contract passages below. Configure OPENAI_API_KEY to enable generated legal Q&A answers."
        return {"answer": answer, "sources": sources}

    client = get_openai_client()
    response = client.chat.completions.create(
        model=settings.OPENAI_MODEL,
        timeout=settings.OPENAI_TIMEOUT_SECONDS,
        max_tokens=min(settings.AI_MAX_OUTPUT_TOKENS, 800),
        messages=[
            {"role": "system", "content": "Answer questions using only the provided contract context. If the answer is not in the context, say so."},
            {"role": "user", "content": f"Question: {safe_question}\n\nContract context:\n{context[:settings.AI_MAX_INPUT_CHARS]}"},
        ],
    )
    return {"answer": (response.choices[0].message.content or "").strip(), "sources": sources}
