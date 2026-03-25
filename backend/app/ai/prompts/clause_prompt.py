def build_clause_prompt(contract_text: str) -> str:
    return f"""
You are a legal clause extraction assistant.

Extract the important clauses from the following contract.

Focus on:
- payment terms
- termination
- renewal
- liability
- confidentiality
- indemnity
- governing law
- data protection
- intellectual property

Contract text:
{contract_text}
""".strip()