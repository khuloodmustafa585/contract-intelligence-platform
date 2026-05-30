from sqlalchemy.orm import Session

from app.core.constants import CONTRACT_STATUS_COMPLETED, CONTRACT_STATUS_FAILED
from app.core.database import SessionLocal
from app.core.logging import app_logger
from app.models.clause import Clause
from app.models.contract import Contract
from app.services.alert_service import generate_alerts_for_contract
from app.services.clause_service import create_clauses
from app.services.obligation_service import create_or_replace_obligations
from app.services.risk_service import create_or_replace_risks
from app.services.summary_service import create_or_replace_summary
from openai import RateLimitError


def analyze_contract(db: Session, contract_id: int) -> dict:
    contract = db.query(Contract).filter(Contract.id == contract_id).first()

    if not contract:
        raise ValueError("Contract not found")

    text = contract.cleaned_text or contract.extracted_text or ""

    if len(text.strip()) < 10:
        app_logger.warning("contract id=%s has no usable text — marking failed", contract_id)
        contract.status = CONTRACT_STATUS_FAILED
        contract.processing_error = "No usable contract text found"
        db.commit()
        return {
            "status": contract.status,
            "error": contract.processing_error,
        }

    # Re-extract clauses when none exist (e.g., user triggers re-analysis after
    # an upload that failed mid-pipeline, or manually requests a fresh extraction).
    existing_clause_count = db.query(Clause).filter(Clause.contract_id == contract_id).count()
    if existing_clause_count == 0:
        app_logger.info("contract id=%s no clauses found — extracting now", contract_id)
        create_clauses(contract_id, text, db)

    app_logger.info("contract id=%s analysis started text_len=%s", contract_id, len(text))

    # ── Summary ──────────────────────────────────────────────────────────────
    # Isolated try/except so a summary failure never prevents risk/obligation extraction.
    summary = None
    try:
        app_logger.info("contract id=%s summary extraction started", contract_id)
        summary = create_or_replace_summary(db, contract.id, text)
        app_logger.info("contract id=%s summary extraction completed", contract_id)
    except RateLimitError:
        app_logger.warning("contract id=%s summary skipped: OpenAI rate limit exceeded", contract_id)
    except Exception:
        app_logger.exception("contract id=%s summary extraction failed", contract_id)

    # ── Risks ─────────────────────────────────────────────────────────────────
    # Isolated try/except so a risk failure never prevents obligation extraction.
    risks: list = []
    try:
        app_logger.info("contract id=%s risk extraction started", contract_id)
        risks = create_or_replace_risks(db, contract.id, text)
        app_logger.info(
            "contract id=%s risk extraction returned %s items",
            contract_id, len(risks),
        )
        app_logger.info("contract id=%s risk save committed", contract_id)
    except RateLimitError:
        app_logger.warning("contract id=%s risk extraction skipped: OpenAI rate limit exceeded", contract_id)
    except Exception:
        app_logger.exception("contract id=%s risk extraction failed", contract_id)

    # ── Obligations ───────────────────────────────────────────────────────────
    obligations: list = []
    try:
        app_logger.info("contract id=%s obligation extraction started", contract_id)
        obligations = create_or_replace_obligations(db, contract.id, text)
        app_logger.info(
            "contract id=%s obligation extraction returned %s items",
            contract_id, len(obligations),
        )
        app_logger.info("contract id=%s obligation save committed", contract_id)
    except RateLimitError:
        app_logger.warning("contract id=%s obligation extraction skipped: OpenAI rate limit exceeded", contract_id)
    except Exception:
        app_logger.exception("contract id=%s obligation extraction failed", contract_id)

    # ── Alerts ────────────────────────────────────────────────────────────────
    alerts: list = []
    try:
        alerts = generate_alerts_for_contract(db, contract.id)
        app_logger.info("contract id=%s alert generation returned %s items", contract_id, len(alerts))
    except Exception:
        app_logger.exception("contract id=%s alert generation failed", contract_id)

    # Always mark completed — risks/obligations may be partial but the pipeline ran.
    contract.status = CONTRACT_STATUS_COMPLETED
    contract.processing_error = None
    db.commit()
    app_logger.info(
        "contract id=%s status committed as completed risk_count=%s obligation_count=%s alert_count=%s",
        contract_id, len(risks), len(obligations), len(alerts),
    )

    return {
        "status": contract.status,
        "summary_id": summary.id if summary else None,
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
