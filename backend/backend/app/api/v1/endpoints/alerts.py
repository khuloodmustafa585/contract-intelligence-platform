from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.api.deps import get_current_user
from app.models.user import User
from app.models.alert import Alert
from app.models.contract import Contract
from app.core.constants import ALERT_STATUS_READ

router = APIRouter(prefix="/alerts", tags=["Alerts"])


@router.get("/")
def get_alerts(
    status: str | None = None,
    alert_type: str | None = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    query = (
        db.query(Alert)
        .join(Contract, Contract.id == Alert.contract_id)
        .filter(Contract.owner_id == current_user.id)
    )

    if status:
        query = query.filter(Alert.status == status)

    if alert_type:
        query = query.filter(Alert.alert_type == alert_type)

    alerts = query.order_by(Alert.created_at.desc()).all()

    return [
        {
            "id": alert.id,
            "contract_id": alert.contract_id,
            "alert_type": alert.alert_type,
            "title": alert.title,
            "message": alert.message,
            "status": alert.status,
            "created_at": alert.created_at,
        }
        for alert in alerts
    ]


@router.patch("/{alert_id}/read")
def mark_as_read(
    alert_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    alert = (
        db.query(Alert)
        .join(Contract, Contract.id == Alert.contract_id)
        .filter(
            Alert.id == alert_id,
            Contract.owner_id == current_user.id
        )
        .first()
    )

    if not alert:
        raise HTTPException(status_code=404, detail="Alert not found")

    alert.status = ALERT_STATUS_READ
    db.commit()
    db.refresh(alert)

    return {"message": "Alert marked as read"}