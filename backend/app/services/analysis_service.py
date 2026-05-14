from sqlalchemy.orm import Session

from app.core.constants import CONTRACT_STATUS_COMPLETED, CONTRACT_STATUS_FAILED
from app.core.database import SessionLocal
from app.core.logging import app_logger
from app.models.contract import Contract
from app.services.alert_service import generate_alerts_for_contract
from app.services.obligation_service import create_or_replace_obligations
from app.services.risk_service import create_or_replace_risks
from app.services.summary_service import create_or_replace_summary


def analyze_contract(db: Session, contract_id: int) -> dict:
    contract = db.query(Contract).filter(Contract.id == contract_id).first()
    if not contract:
        raise ValueError("Contract not found")

    text = contract.cleaned_text or contract.extracted_text or ""
    if len(text.strip()) < 10:
        contract.status = CONTRACT_STATUS_FAILED
        contract.processing_error = "No usable contract text found"
        db.commit()
        return {"status": contract.status, "error": contract.processing_error}

    summary = create_or_replace_summary(db, contract.id, text)
    risks = create_or_replace_risks(db, contract.id, text)
    obligations = create_or_replace_obligations(db, contract.id, text)
    alerts = generate_alerts_for_contract(db, contract.id)

    contract.status = CONTRACT_STATUS_COMPLETED
    contract.processing_error = None
    db.commit()

    return {
        "status": contract.status,
        "summary_id": summary.id,
        "risk_count": len(risks),
        "obligation_count": len(obligations),
        "alert_count": len(alerts),
    }


def analyze_contract_task(contract_id: int):
    db = SessionLocal()
    try:
        analyze_contract(db, contract_id)
    except Exception:
        app_logger.exception("Analysis task failed for contract id=%s", contract_id)
        contract = db.query(Contract).filter(Contract.id == contract_id).first()
        if contract:
            contract.status = CONTRACT_STATUS_FAILED
            contract.processing_error = "Analysis failed. Please retry or contact support."
            db.commit()
    finally:
        db.close()
