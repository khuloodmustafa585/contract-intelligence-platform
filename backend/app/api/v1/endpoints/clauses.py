from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from typing import Optional

from app.core.database import get_db
from app.api.deps import get_current_user
from app.models.user import User

router = APIRouter(prefix="/clauses", tags=["Clauses"])

@router.get("/contract/{contract_id}")
def get_clauses_by_contract(
    contract_id: int,
    category: Optional[str] = Query(None),
    q: Optional[str] = Query(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    clauses = [
        {
            "id": 1,
            "category": "Payment",
            "heading": "Payment Terms",
            "text": "Payment must be made within 30 days."
        },
        {
            "id": 2,
            "category": "Termination",
            "heading": "Termination Clause",
            "text": "Either party may terminate with 30 days notice."
        },
        {
            "id": 3,
            "category": "Liability",
            "heading": "Liability Cap",
            "text": "Liability is limited to annual fees."
        }
    ]

    # Filter by category
    if category:
        clauses = [
            clause for clause in clauses
            if clause["category"].lower() == category.lower()
        ]

    # Search by keyword
    if q:
        clauses = [
            clause for clause in clauses
            if q.lower() in clause["text"].lower()
            or q.lower() in clause["heading"].lower()
        ]

    return {
        "contract_id": contract_id,
        "filters": {
            "category": category,
            "search": q
        },
        "count": len(clauses),
        "clauses": clauses
    }
    return {
        "contract_id": contract_id,
        "filters": {
            "category": category,
            "search": q
        },
        "clauses": [
            {
                "id": 1,
                "category": "Payment",
                "heading": "Payment Terms",
                "text": "Payment must be made within 30 days."
            },
            {
                "id": 2,
                "category": "Termination",
                "heading": "Termination Clause",
                "text": "Either party may terminate with 30 days notice."
            }
        ]
    }


# Get single clause
@router.get("/{clause_id}")
def get_single_clause(
    clause_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return {
        "id": clause_id,
        "category": "Liability",
        "heading": "Liability Clause",
        "text": "Liability is limited to annual fees."
    }   