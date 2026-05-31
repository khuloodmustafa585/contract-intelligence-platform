from app.ai.prompts.summary_prompt import build_summary_prompt
from app.ai.prompts.risk_prompt import build_risk_prompt
from app.ai.prompts.clause_prompt import build_clause_prompt


def get_prompt_by_task(task: str, contract_text: str) -> str:
    """
    Returns the correct prompt based on analysis task.
    """
    if task == "summary":
        return build_summary_prompt(contract_text)

    if task == "risk":
        return build_risk_prompt(contract_text)

    if task == "clause":
        return build_clause_prompt(contract_text)

    raise ValueError(f"Unsupported task: {task}")


def format_ai_response(response_text: str) -> str:
    """
    Basic cleanup for AI output.
    """
    if not response_text:
        return ""

    return response_text.strip()