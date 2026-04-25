from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from typing import List

from app.core.database import get_db
from app.services.contract_service import (
    create_contract,
    get_contracts,
    get_contract_by_id,
)
from app.schemas.contract import (
    ContractCreate,
    ContractResponse,
    ContractStatusResponse,
)
from app.models.user import User
from app.api.deps import get_current_user
from app.services.retrieval_service import search_in_contract
from app.models.contract import Contract


router = APIRouter(prefix="/contracts", tags=["Contracts"])


# Create new contract
@router.post("/", response_model=ContractResponse, status_code=status.HTTP_201_CREATED)
def create_new_contract(
    contract_data: ContractCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return create_contract(db, contract_data, current_user.id)


# Get all user contracts
@router.get("/", response_model=List[ContractResponse])
def read_contracts(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return get_contracts(db, current_user.id)


# Get single contract
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


# Get contract status only
@router.get("/{contract_id}/status", response_model=ContractStatusResponse)
def get_contract_status(
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


# Search inside contract
@router.get("/{contract_id}/search")
def search_contract(
    contract_id: int,
    query: str = Query(..., min_length=1),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    contract = db.query(Contract).filter(
        Contract.id == contract_id,
        Contract.owner_id == current_user.id
    ).first()

    if not contract:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Contract not found"
        )

    results = search_in_contract(contract_id, query, db)

    return {
        "contract_id": contract_id,
        "query": query,
        "results": results
    }