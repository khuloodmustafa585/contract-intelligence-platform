_APPROVED_CATEGORIES = [
    "Indemnity",
    "Confidentiality",
    "Liability",
    "Payment Terms",
    "Termination",
    "Governing Law",
    "Intellectual Property",
    "Term and Duration",
    "Data Protection",
    "Unclassified",
]

_CATEGORY_BLOCK = "\n".join(f"  - {c}" for c in _APPROVED_CATEGORIES)


def build_clause_prompt(contract_text: str) -> str:
    return f"""
You are a legal clause extraction assistant. Extract every distinct clause from the
contract text below and return them as a JSON object.

Return ONLY valid JSON — no markdown fences, no prose. Format:

{{
  "clauses": [
    {{
      "heading": "exact heading or section title as it appears in the document, or null if absent",
      "text": "full verbatim body text of the clause — do NOT truncate or summarise",
      "category": "one of the approved categories listed below"
    }}
  ]
}}

━━━ APPROVED CATEGORIES (use EXACTLY one per clause) ━━━
{_CATEGORY_BLOCK}

STRICT RULES for "category":
1. You MUST choose exactly one category from the approved list above.
2. Do NOT invent new category names.
3. Do NOT use synonyms, abbreviations, or variations (e.g. "IP" is NOT allowed — use "Intellectual Property").
4. If a clause does not clearly match any of the first nine categories, set category to "Unclassified".

Category guidance:
- Data Protection   → personal data, GDPR, data subject, data controller, data processing agreement
- Indemnity         → indemnify, indemnification, hold harmless, indemnitor
- Intellectual Property → patents, copyrights, trademarks, IP rights, ownership of work product
- Governing Law     → governing law, jurisdiction, arbitration, dispute resolution, choice of law
- Confidentiality   → confidential information, non-disclosure, NDA, proprietary information
- Termination       → terminate, termination for convenience, right to terminate, notice of termination
- Term and Duration → effective date, commencement, initial term, renewal, auto-renewal, expiration, duration
- Liability         → limitation of liability, consequential damages, cap on liability, aggregate liability
- Payment Terms     → payment, invoice, fees, billing, compensation, charges, remuneration

Rules for "heading" and "text":
- "heading" must be the exact section number and title as printed in the document.
  Set to null if there is no recognisable heading.
- "text" must contain the complete clause body — do NOT paraphrase.
- Preserve the original clause order.
- Include every clause, including short or boilerplate ones.

Contract text:
{contract_text}
""".strip()
