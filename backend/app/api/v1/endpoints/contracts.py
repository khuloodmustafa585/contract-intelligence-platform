from fastapi import APIRouter, Depends, HTTPException, status, Query, BackgroundTasks
from sqlalchemy.orm import Session
from typing import List
from app.core.database import get_db
from app.services.contract_service import (
    create_contract,
    get_contracts,
    get_contract_by_id,
)
from app.schemas.contract import (
    AskAIRequest,
    AskAIResponse,
    ClauseResponse,
    ContractCreate,
    ContractDetailResponse,
    ContractResponse,
    ObligationResponse,
    RiskResponse,
    SummaryResponse,
)
from app.models.user import User
from app.api.deps import get_current_user
from app.services.retrieval_service import search_in_contract
from app.models.contract import Contract
from app.models.clause import Clause
from app.models.risk import Risk
from app.models.summary import Summary
from app.models.obligation import Obligation
from app.services.analysis_service import analyze_contract_task
from app.services.qa_service import answer_contract_question
from app.core.rate_limit import rate_limit


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

@router.get("/{contract_id}", response_model=ContractDetailResponse)
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


@router.post("/{contract_id}/analyze")
def analyze_contract_endpoint(
    contract_id: int,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    _: None = Depends(rate_limit("analysis", 10, 60)),
):
    contract = get_contract_by_id(db, contract_id, current_user.id)
    if not contract:
        raise HTTPException(status_code=404, detail="Contract not found")
    background_tasks.add_task(analyze_contract_task, contract_id)
    return {"message": "Analysis started", "contract_id": contract_id}


@router.get("/{contract_id}/clauses", response_model=list[ClauseResponse])
def get_contract_clauses(contract_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    contract = get_contract_by_id(db, contract_id, current_user.id)
    if not contract:
        raise HTTPException(status_code=404, detail="Contract not found")
    return db.query(Clause).filter(Clause.contract_id == contract_id).order_by(Clause.order_index).all()


@router.get("/{contract_id}/risks", response_model=list[RiskResponse])
def get_contract_risks(contract_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    contract = get_contract_by_id(db, contract_id, current_user.id)
    if not contract:
        raise HTTPException(status_code=404, detail="Contract not found")
    return db.query(Risk).filter(Risk.contract_id == contract_id).order_by(Risk.created_at.desc()).all()


@router.get("/{contract_id}/summaries", response_model=list[SummaryResponse])
def get_contract_summaries(contract_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    contract = get_contract_by_id(db, contract_id, current_user.id)
    if not contract:
        raise HTTPException(status_code=404, detail="Contract not found")
    return db.query(Summary).filter(Summary.contract_id == contract_id).order_by(Summary.created_at.desc()).all()


@router.get("/{contract_id}/obligations", response_model=list[ObligationResponse])
def get_contract_obligations(contract_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    contract = get_contract_by_id(db, contract_id, current_user.id)
    if not contract:
        raise HTTPException(status_code=404, detail="Contract not found")
    return db.query(Obligation).filter(Obligation.contract_id == contract_id).order_by(Obligation.created_at.desc()).all()

@router.get("/{contract_id}/search")
def search_contract(
    contract_id: int,
    query: str = Query(..., min_length=1),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    # Check contract belongs to user
    contract = db.query(Contract).filter(
        Contract.id == contract_id,
        Contract.owner_id == current_user.id
    ).first()

    if not contract:
        raise HTTPException(status_code=404, detail="Contract not found")

    results = search_in_contract(contract_id, query, db)

    return {
        "contract_id": contract_id,
        "query": query,
        "results": results
    }


@router.post("/{contract_id}/ask", response_model=AskAIResponse)
def ask_contract_ai(
    contract_id: int,
    payload: AskAIRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    _: None = Depends(rate_limit("ask_ai", 20, 60)),
):
    contract = get_contract_by_id(db, contract_id, current_user.id)
    if not contract:
        raise HTTPException(status_code=404, detail="Contract not found")
    return answer_contract_question(db, contract, payload.question)


@router.delete("/{contract_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_contract(
    contract_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    import os
    contract = get_contract_by_id(db, contract_id, current_user.id)
    if not contract:
        raise HTTPException(status_code=404, detail="Contract not found")
    if contract.file_path and os.path.exists(contract.file_path):
        try:
            os.remove(contract.file_path)
        except OSError:
            pass
    db.delete(contract)
    db.commit()


@router.post("/{contract_id}/retry")
def retry_contract_processing(
    contract_id: int,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    from app.core.constants import CONTRACT_STATUS_FAILED, CONTRACT_STATUS_PROCESSING
    from app.services.upload_service import process_contract
    contract = get_contract_by_id(db, contract_id, current_user.id)
    if not contract:
        raise HTTPException(status_code=404, detail="Contract not found")
    if contract.status != CONTRACT_STATUS_FAILED:
        raise HTTPException(status_code=400, detail="Only failed contracts can be retried")
    contract.status = CONTRACT_STATUS_PROCESSING
    contract.processing_error = None
    db.commit()
    background_tasks.add_task(process_contract, contract_id)
    return {"message": "Retry started", "contract_id": contract_id}


@router.get("/{contract_id}/status")
def get_contract_status(
    contract_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    contract = get_contract_by_id(db, contract_id, current_user.id)
    if not contract:
        raise HTTPException(status_code=404, detail="Contract not found")
    return {
        "id": contract.id,
        "status": contract.status,
        "embedding_status": contract.embedding_status,
        "is_indexed": contract.is_indexed,
        "processing_error": contract.processing_error,
    }
