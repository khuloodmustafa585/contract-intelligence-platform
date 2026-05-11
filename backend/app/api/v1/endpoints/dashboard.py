from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.api.deps import get_current_user

from app.models.user import User

from app.schemas.dashboard import DashboardResponse
from app.services.analytics_service import get_dashboard_metrics


router = APIRouter(
    prefix="/dashboard",
    tags=["Dashboard"]
)


@router.get("/metrics", response_model=DashboardResponse)
def get_dashboard(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    try:
        return get_dashboard_metrics(db, current_user.id)

    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=str(e)
        )