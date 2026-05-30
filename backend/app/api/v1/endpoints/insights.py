from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.api.deps import get_current_user
from app.core.database import get_db
from app.models.contract import Contract
from app.models.obligation import Obligation
from app.models.risk import Risk
from app.models.summary import Summary
from app.models.user import User
from app.schemas.contract import ObligationResponse, RiskResponse, SummaryResponse

router = APIRouter(prefix="/insights", tags=["Insights"])


@router.get("/risks", response_model=list[RiskResponse])
def list_risks(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    return (
        db.query(Risk)
        .join(Contract, Contract.id == Risk.contract_id)
        .filter(Contract.owner_id == current_user.id)
        .order_by(Risk.created_at.desc())
        .all()
    )


@router.get("/summaries", response_model=list[SummaryResponse])
def list_summaries(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    return (
        db.query(Summary)
        .join(Contract, Contract.id == Summary.contract_id)
        .filter(Contract.owner_id == current_user.id)
        .order_by(Summary.created_at.desc())
        .all()
    )


@router.get("/obligations", response_model=list[ObligationResponse])
def list_obligations(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    return (
        db.query(Obligation)
        .join(Contract, Contract.id == Obligation.contract_id)
        .filter(Contract.owner_id == current_user.id)
        .order_by(Obligation.created_at.desc())
        .all()
    )
