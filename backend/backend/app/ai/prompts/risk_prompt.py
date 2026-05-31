def build_risk_prompt(contract_text: str) -> str:
    return f"""
You are a legal risk analysis assistant.

Analyze the following contract and identify the main legal and business risks.

Focus on:
- unlimited liability
- weak termination rights
- weak confidentiality
- missing data protection
- auto-renewal
- unfavorable payment terms
- non-standard clauses

Contract text:
{contract_text}
""".strip()