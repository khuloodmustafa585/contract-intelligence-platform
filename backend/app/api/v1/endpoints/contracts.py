from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List

from app.core.database import get_db
from app.services.contract_service import (
    create_contract,
    get_contracts,
    get_contract_by_id,
)
from app.schemas.contract import ContractCreate, ContractResponse
from app.models.user import User
from app.api.deps import get_current_user


router = APIRouter(prefix="/contracts", tags=["Contracts"])

@router.post("/", response_model=ContractResponse, status_code=status.HTTP_201_CREATED)
def create_new_contract(
    contract_data: ContractCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return create_contract(db, contract_data, current_user.id)

@router.get("/", response_model=List[ContractResponse])
def read_contracts(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return get_contracts(db, current_user.id)

@router.get("/{contract_id}", response_model=ContractResponse)
def read_contract(
    contract_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    contract = get_contract_by_id(db, contract_id, current_user.id)

    if not contract:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Contract not found",
        )

    return contract