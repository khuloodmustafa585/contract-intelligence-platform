from app.models.contract import Contract
from sqlalchemy.orm import Session


def retrieve_contract_text(contract_id: int, db: Session) -> str:
    contract = db.query(Contract).filter(Contract.id == contract_id).first()

    if not contract or not contract.cleaned_text:
        return ""

    return contract.cleaned_text

def search_in_contract(contract_id: int, query: str, db: Session) -> list[str]:
    contract = db.query(Contract).filter(Contract.id == contract_id).first()

    if not contract or not contract.cleaned_text:
        return []

    text = contract.cleaned_text.lower()
    query = query.lower()

    results = []

    paragraphs = text.split("\n")

    for para in paragraphs:
        if any(word in para for word in query.split()):            
            
            results.append(para.strip())
            
    return results[:5]