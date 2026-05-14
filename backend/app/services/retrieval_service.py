from app.models.contract import Contract
from sqlalchemy.orm import Session
from app.services.embedding_service import search_similar_clauses


def retrieve_contract_text(contract_id: int, db: Session) -> str:
    contract = db.query(Contract).filter(Contract.id == contract_id).first()

    if not contract or not contract.cleaned_text:
        return ""

    return contract.cleaned_text

    
def search_in_contract(contract_id: int, query: str, db: Session):
    contract = db.query(Contract).filter(Contract.id == contract_id).first()

    if not contract:
        return []

    return search_similar_clauses(query, contract_id=contract_id)
