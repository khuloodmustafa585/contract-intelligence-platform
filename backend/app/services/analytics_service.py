from sqlalchemy.orm import Session
from sqlalchemy import func
from datetime import date, timedelta

from app.models.contract import Contract
from app.models.risk import Risk
from app.models.obligation import Obligation
from app.models.alert import Alert

from app.core.constants import (
    RISK_SEVERITY_HIGH,
    OBLIGATION_STATUS_PENDING,
    OBLIGATION_STATUS_COMPLETED,
    OBLIGATION_STATUS_OVERDUE,
    ALERT_STATUS_UNREAD,
)


def get_dashboard_metrics(db: Session, user_id: int) -> dict:
    today = date.today()
    limit_date = today + timedelta(days=30)

    total_contracts = (
        db.query(func.count(Contract.id))
        .filter(Contract.owner_id == user_id)
        .scalar()
    )

    high_risk_contracts = (
        db.query(func.count(Risk.id))
        .join(Contract, Contract.id == Risk.contract_id)
        .filter(
            Contract.owner_id == user_id,
            Risk.severity == RISK_SEVERITY_HIGH
        )
        .scalar()
    )

    expiring_soon = (
        db.query(func.count(Contract.id))
        .filter(
            Contract.owner_id == user_id,
            Contract.expiration_date.isnot(None),
            Contract.expiration_date >= today,
            Contract.expiration_date <= limit_date
        )
        .scalar()
    )

    overdue_contracts = (
        db.query(func.count(Contract.id))
        .filter(
            Contract.owner_id == user_id,
            Contract.expiration_date.isnot(None),
            Contract.expiration_date < today
        )
        .scalar()
    )

    upcoming_obligations = (
        db.query(func.count(Obligation.id))
        .join(Contract, Contract.id == Obligation.contract_id)
        .filter(
            Contract.owner_id == user_id,
            Obligation.status == OBLIGATION_STATUS_PENDING,
            Obligation.due_date.isnot(None),
            Obligation.due_date >= today,
            Obligation.due_date <= limit_date
        )
        .scalar()
    )


    overdue_obligations = (
        db.query(func.count(Obligation.id))
        .join(Contract, Contract.id == Obligation.contract_id)
        .filter(
            Contract.owner_id == user_id,
            Obligation.status.in_([
                OBLIGATION_STATUS_PENDING,
                OBLIGATION_STATUS_OVERDUE
            ]),
            Obligation.due_date.isnot(None),
            Obligation.due_date < today
        )
        .scalar()
    )
    
    recent_uploads = (
        db.query(Contract)
        .filter(Contract.owner_id == user_id)
        .order_by(Contract.created_at.desc())
        .limit(5)
        .all()
    )

    unread_alerts = (
        db.query(func.count(Alert.id))
        .join(Contract, Contract.id == Alert.contract_id)
        .filter(
            Contract.owner_id == user_id,
            Alert.status == ALERT_STATUS_UNREAD
        )
        .scalar()
    )

    return {
        "total_contracts": total_contracts or 0,
        "high_risk_contracts": high_risk_contracts or 0,
        "expiring_soon": expiring_soon or 0,
        "overdue_contracts": overdue_contracts or 0,
        "upcoming_obligations": upcoming_obligations or 0,
        "overdue_obligations": overdue_obligations or 0,
        "recent_uploads": recent_uploads,
        "unread_alerts": unread_alerts or 0,
    }