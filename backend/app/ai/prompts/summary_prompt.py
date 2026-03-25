def build_summary_prompt(contract_text: str) -> str:
    return f"""
You are a legal AI assistant.

Summarize the following contract in a clear and concise way.

Focus on:
- contract purpose
- key terms
- major obligations
- important risks
- recommended next steps

Contract text:
{contract_text}
""".strip()