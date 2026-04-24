from sqlalchemy.orm import Session
from typing import List, Optional

from app.models.contract import Contract
from app.schemas.contract import ContractCreate

def create_contract(db: Session, contract_data: ContractCreate, user_id: int) -> Contract:
    new_contract = Contract(
        title=contract_data.title,
        status="uploaded",
        owner_id=user_id,
    )

    db.add(new_contract)
    db.commit()
    db.refresh(new_contract)

    return new_contract

def get_contracts(db: Session, user_id: int) -> List[Contract]:
    return db.query(Contract).filter(Contract.owner_id == user_id).all()

def get_contract_by_id(db: Session, contract_id: int, user_id: int) -> Optional[Contract]:
    return (
        db.query(Contract)
        .filter(Contract.id == contract_id, Contract.owner_id == user_id)
        .first()
    )

def get_contract_status_counts(db: Session):
    results = (
        db.query(Contract.status, func.count(Contract.id))
        .group_by(Contract.status)
        .all()
    )

    counts = {status: 0 for status in CONTRACT_STATUSES}

    for status, count in results:
        counts[status] = count

    counts["total_contracts"] = sum(counts.values())

    return counts