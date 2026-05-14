from sqlalchemy.orm import Session
from datetime import date, timedelta

from app.models.contract import Contract
from app.models.obligation import Obligation
from app.models.risk import Risk
from app.models.alert import Alert

from app.core.constants import (
    ALERT_TYPE_EXPIRING_SOON,
    ALERT_TYPE_DUE_SOON,
    ALERT_TYPE_OVERDUE,
    ALERT_TYPE_HIGH_RISK,
    ALERT_STATUS_UNREAD,
)


def generate_expiring_contract_alerts(db: Session):
    today = date.today()
    limit_date = today + timedelta(days=30)

    contracts = (
        db.query(Contract)
        .filter(
            Contract.expiration_date != None,
            Contract.expiration_date <= limit_date
        )
        .all()
    )

    for contract in contracts:
        existing = db.query(Alert).filter(
            Alert.contract_id == contract.id,
            Alert.alert_type == ALERT_TYPE_EXPIRING_SOON
        ).first()

        if not existing:
            alert = Alert(
                contract_id=contract.id,
                alert_type=ALERT_TYPE_EXPIRING_SOON,
                title="Contract expiring soon",
                message=f"Contract '{contract.title}' is expiring soon.",
                trigger_date=contract.expiration_date,
                status=ALERT_STATUS_UNREAD
            )
            db.add(alert)

    db.commit()


def generate_obligation_alerts(db: Session):
    today = date.today()
    limit_date = today + timedelta(days=30)

    obligations = (
        db.query(Obligation)
        .filter(Obligation.due_date != None)
        .all()
    )

    for obligation in obligations:
        if obligation.due_date <= today:
            alert_type = ALERT_TYPE_OVERDUE
            title = "Obligation overdue"
            message = f"Obligation '{obligation.title}' is overdue."
        elif obligation.due_date <= limit_date:
            alert_type = ALERT_TYPE_DUE_SOON
            title = "Obligation due soon"
            message = f"Obligation '{obligation.title}' is due soon."
        else:
            continue

        existing = db.query(Alert).filter(
            Alert.obligation_id == obligation.id,
            Alert.alert_type == alert_type
        ).first()

        if not existing:
            alert = Alert(
                contract_id=obligation.contract_id,
                obligation_id=obligation.id,
                alert_type=alert_type,
                title=title,
                message=message,
                trigger_date=obligation.due_date,
                status=ALERT_STATUS_UNREAD
            )
            db.add(alert)

    db.commit()


def generate_high_risk_alerts(db: Session):
    risks = (
        db.query(Risk)
        .filter(Risk.severity == "high")
        .all()
    )

    for risk in risks:
        existing = db.query(Alert).filter(
            Alert.risk_id == risk.id,
            Alert.alert_type == ALERT_TYPE_HIGH_RISK
        ).first()

        if not existing:
            alert = Alert(
                contract_id=risk.contract_id,
                risk_id=risk.id,
                alert_type=ALERT_TYPE_HIGH_RISK,
                title="High risk detected",
                message=f"High risk found: {risk.title}",
                status=ALERT_STATUS_UNREAD
            )
            db.add(alert)

    db.commit()


def generate_alerts_for_contract(db: Session, contract_id: int) -> list[Alert]:
    today = date.today()
    limit_date = today + timedelta(days=30)
    created: list[Alert] = []

    contract = db.query(Contract).filter(Contract.id == contract_id).first()
    if not contract:
        return created

    if contract.expiration_date and today <= contract.expiration_date <= limit_date:
        existing = db.query(Alert).filter(
            Alert.contract_id == contract_id,
            Alert.alert_type == ALERT_TYPE_EXPIRING_SOON,
        ).first()
        if not existing:
            created.append(Alert(
                contract_id=contract_id,
                alert_type=ALERT_TYPE_EXPIRING_SOON,
                title="Contract expiring soon",
                message=f"Contract '{contract.title}' expires on {contract.expiration_date.isoformat()}.",
                trigger_date=contract.expiration_date,
                status=ALERT_STATUS_UNREAD,
            ))

    obligations = db.query(Obligation).filter(Obligation.contract_id == contract_id).all()
    for obligation in obligations:
        if not obligation.due_date:
            continue
        if obligation.due_date < today:
            alert_type, title = ALERT_TYPE_OVERDUE, "Obligation overdue"
        elif obligation.due_date <= limit_date:
            alert_type, title = ALERT_TYPE_DUE_SOON, "Obligation due soon"
        else:
            continue
        existing = db.query(Alert).filter(Alert.obligation_id == obligation.id, Alert.alert_type == alert_type).first()
        if not existing:
            created.append(Alert(
                contract_id=contract_id,
                obligation_id=obligation.id,
                alert_type=alert_type,
                title=title,
                message=f"Obligation '{obligation.title}' needs attention.",
                trigger_date=obligation.due_date,
                status=ALERT_STATUS_UNREAD,
            ))

    risks = db.query(Risk).filter(Risk.contract_id == contract_id, Risk.severity == "high").all()
    for risk in risks:
        existing = db.query(Alert).filter(Alert.risk_id == risk.id, Alert.alert_type == ALERT_TYPE_HIGH_RISK).first()
        if not existing:
            created.append(Alert(
                contract_id=contract_id,
                risk_id=risk.id,
                alert_type=ALERT_TYPE_HIGH_RISK,
                title="High risk detected",
                message=f"High risk found: {risk.title}",
                status=ALERT_STATUS_UNREAD,
            ))

    for alert in created:
        db.add(alert)
    db.commit()
    for alert in created:
        db.refresh(alert)
    return created
