from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.constants import CONTRACT_STATUS_ANALYSIS_FAILED, CONTRACT_STATUS_COMPLETED, CONTRACT_STATUS_FAILED
from app.core.database import SessionLocal
from app.core.logging import app_logger
from app.models.contract import Contract
from app.services.alert_service import generate_alerts_for_contract
from app.services.clause_service import create_clauses
from app.services.obligation_service import create_or_replace_obligations
from app.services.risk_service import create_or_replace_risks
from app.services.summary_service import create_or_replace_summary
from openai import APIConnectionError, APIStatusError, APITimeoutError, RateLimitError

# All OpenAI-specific transient errors that indicate the service is unavailable.
_OPENAI_TRANSIENT = (RateLimitError, APIConnectionError, APITimeoutError, APIStatusError)


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

    # ── Early guard: API key must be present ─────────────────────────────────
    # The sub-services each have their own "if not OPENAI_API_KEY: return fallback"
    # guards which silently produce regex/heuristic data.  That data looks like a
    # real analysis result, so without this check the contract would be marked
    # completed even though OpenAI was never called.
    app_logger.info(
        "contract id=%s analysis starting: openai_key_configured=%s text_len=%s",
        contract_id, bool(settings.OPENAI_API_KEY), len(text),
    )
    if not settings.OPENAI_API_KEY:
        app_logger.warning(
            "contract id=%s OPENAI_API_KEY not configured — marking analysis_failed",
            contract_id,
        )
        contract.status = CONTRACT_STATUS_ANALYSIS_FAILED
        contract.processing_error = "AI analysis is currently unavailable. Please try again later."
        db.commit()
        return {
            "status": contract.status,
            "summary_id": None,
            "risk_count": 0,
            "obligation_count": 0,
            "alert_count": 0,
        }

    # Always recreate clauses so every analysis (new upload or re-analysis) runs
    # the current split_into_clauses segmentation logic.  clause_service.create_clauses
    # issues a DELETE before inserting, so this is idempotent and safe to call
    # unconditionally.  The old guard (if count == 0) caused upload_service to write
    # bad 3-clause blobs that analysis then permanently skipped re-creating.
    app_logger.info("contract id=%s recreating clauses via split_into_clauses", contract_id)
    create_clauses(contract_id, text, db)

    # Track how many of the three AI calls failed due to OpenAI being unavailable.
    openai_failure_count = 0

    # ── Summary ───────────────────────────────────────────────────────────────
    summary = None
    try:
        app_logger.info("contract id=%s [OpenAI] calling summary extraction", contract_id)
        summary = create_or_replace_summary(db, contract.id, text)
        app_logger.info("contract id=%s [OpenAI] summary extraction completed — summary_id=%s", contract_id, summary.id if summary else None)
    except _OPENAI_TRANSIENT as exc:
        openai_failure_count += 1
        app_logger.warning(
            "contract id=%s [OpenAI] summary FAILED with %s (openai_failure_count=%s)",
            contract_id, type(exc).__name__, openai_failure_count,
        )
    except Exception:
        app_logger.exception("contract id=%s summary extraction raised unexpected error", contract_id)

    # ── Risks ─────────────────────────────────────────────────────────────────
    risks: list = []
    try:
        app_logger.info("contract id=%s [OpenAI] calling risk extraction", contract_id)
        risks = create_or_replace_risks(db, contract.id, text)
        app_logger.info("contract id=%s [OpenAI] risk extraction completed — %s items", contract_id, len(risks))
    except _OPENAI_TRANSIENT as exc:
        openai_failure_count += 1
        app_logger.warning(
            "contract id=%s [OpenAI] risk extraction FAILED with %s (openai_failure_count=%s)",
            contract_id, type(exc).__name__, openai_failure_count,
        )
    except Exception:
        app_logger.exception("contract id=%s risk extraction raised unexpected error", contract_id)

    # ── Obligations ───────────────────────────────────────────────────────────
    obligations: list = []
    try:
        app_logger.info("contract id=%s [OpenAI] calling obligation extraction", contract_id)
        obligations = create_or_replace_obligations(db, contract.id, text)
        app_logger.info("contract id=%s [OpenAI] obligation extraction completed — %s items", contract_id, len(obligations))
    except _OPENAI_TRANSIENT as exc:
        openai_failure_count += 1
        app_logger.warning(
            "contract id=%s [OpenAI] obligation extraction FAILED with %s (openai_failure_count=%s)",
            contract_id, type(exc).__name__, openai_failure_count,
        )
    except Exception:
        app_logger.exception("contract id=%s obligation extraction raised unexpected error", contract_id)

    # ── Alerts ────────────────────────────────────────────────────────────────
    alerts: list = []
    try:
        alerts = generate_alerts_for_contract(db, contract.id)
        app_logger.info("contract id=%s alert generation returned %s items", contract_id, len(alerts))
    except Exception:
        app_logger.exception("contract id=%s alert generation failed", contract_id)

    # ── Final status decision ─────────────────────────────────────────────────
    any_data = summary is not None or bool(risks) or bool(obligations)
    app_logger.info(
        "contract id=%s final decision: openai_failure_count=%s any_data=%s "
        "(summary=%s risks=%s obligations=%s)",
        contract_id, openai_failure_count, any_data,
        summary is not None, len(risks), len(obligations),
    )

    # All three AI calls failed with OpenAI errors AND produced no data →
    # mark analysis_failed so the user can retry when OpenAI is back.
    # Partial success (at least one call worked) → completed.
    if openai_failure_count == 3 and not any_data:
        app_logger.warning(
            "contract id=%s → setting analysis_failed (all three OpenAI calls failed)",
            contract_id,
        )
        contract.status = CONTRACT_STATUS_ANALYSIS_FAILED
        contract.processing_error = "AI analysis is currently unavailable. Please try again later."
    else:
        app_logger.info(
            "contract id=%s → setting completed (openai_failure_count=%s any_data=%s)",
            contract_id, openai_failure_count, any_data,
        )
        contract.status = CONTRACT_STATUS_COMPLETED
        contract.processing_error = None

    db.commit()
    app_logger.info(
        "contract id=%s status committed as %s risk_count=%s obligation_count=%s alert_count=%s",
        contract_id, contract.status, len(risks), len(obligations), len(alerts),
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
