from sqlalchemy.orm import Session
from app.models.contract import Contract


def get_contracts_by_user(db: Session, user_id: int):
    return db.query(Contract).filter(Contract.owner_id == user_id).all()


def get_contract_by_id(db: Session, contract_id: int):
    return db.query(Contract).filter(Contract.id == contract_id).first()