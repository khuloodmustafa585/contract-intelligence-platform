import mimetypes
import os
import uuid

from fastapi import HTTPException, UploadFile, status
from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.constants import (
    CONTRACT_STATUS_ANALYSIS_FAILED,
    CONTRACT_STATUS_ANALYSIS_PENDING,
    CONTRACT_STATUS_INDEXING,
    CONTRACT_STATUS_PARSED,
    CONTRACT_STATUS_PROCESSING,
    SUPPORTED_FILE_TYPES,
)
from app.core.database import SessionLocal
from app.core.logging import app_logger, security_logger
from app.models.contract import Contract
from app.services.analysis_service import analyze_contract
from app.services.clause_service import create_clauses
from app.services.embedding_service import upsert_embeddings
from app.services.metadata_service import save_contract_metadata
from app.services.parser_service import extract_text

ALLOWED_MIME_TYPES = {
    "pdf": {"application/pdf"},
    "docx": {"application/vnd.openxmlformats-officedocument.wordprocessingml.document", "application/octet-stream"},
    "jpg": {"image/jpeg"},
    "jpeg": {"image/jpeg"},
    "png": {"image/png"},
}


def validate_file(file: UploadFile) -> str:
    file_name = file.filename or ""
    file_ext = os.path.splitext(file_name)[1].lower().lstrip(".")
    if f".{file_ext}" not in SUPPORTED_FILE_TYPES and file_ext not in {"jpg", "jpeg", "png"}:
        security_logger.warning("Suspicious upload extension rejected: %s", file_name)
        raise HTTPException(status_code=400, detail="Unsupported file type")

    content_type = (file.content_type or mimetypes.guess_type(file_name)[0] or "").lower()
    if content_type and content_type not in ALLOWED_MIME_TYPES.get(file_ext, set()):
        security_logger.warning("Suspicious upload MIME rejected: file=%s mime=%s", file_name, content_type)
        raise HTTPException(status_code=400, detail="Unsupported file MIME type")
    return file_ext


async def read_limited_file(file: UploadFile) -> bytes:
    max_bytes = settings.MAX_FILE_SIZE_MB * 1024 * 1024
    contents = await file.read(max_bytes + 1)
    if len(contents) > max_bytes:
        security_logger.warning("Oversized upload rejected: %s bytes", len(contents))
        raise HTTPException(status_code=413, detail=f"File too large. Max size is {settings.MAX_FILE_SIZE_MB} MB")
    if not contents:
        raise HTTPException(status_code=400, detail="Uploaded file is empty")
    return contents


def save_file(file_ext: str, contents: bytes) -> tuple[str, str]:
    os.makedirs(settings.UPLOAD_DIR, exist_ok=True)
    unique_filename = f"{uuid.uuid4()}.{file_ext}"
    file_path = os.path.join(settings.UPLOAD_DIR, unique_filename)
    with open(file_path, "wb") as f:
        f.write(contents)
    return unique_filename, file_path


async def handle_upload(file: UploadFile, db: Session, user_id: int, background_tasks):
    file_ext = validate_file(file)
    contents = await read_limited_file(file)
    unique_filename, file_path = save_file(file_ext, contents)

    contract = Contract(
        title=file.filename or unique_filename,
        status=CONTRACT_STATUS_PROCESSING,
        owner_id=user_id,
        file_name=unique_filename,
        file_path=file_path,
        file_type=file_ext,
    )
    db.add(contract)
    db.commit()
    db.refresh(contract)

    background_tasks.add_task(process_contract, contract.id)
    return {
        "id": contract.id,
        "title": contract.title,
        "status": contract.status,
        "file_name": contract.file_name,
        "message": "File uploaded. Processing started.",
    }


def process_contract(contract_id: int):
    db = SessionLocal()
    contract = None

    # ── Phase 1: parse, index, embed ─────────────────────────────────────────
    # Any failure here means the file could not be processed at all.
    # We delete the contract record and the uploaded file so nothing appears
    # in Recent Contracts or the Contracts page.
    try:
        contract = db.query(Contract).filter(Contract.id == contract_id).first()
        if not contract or not contract.file_path:
            db.close()
            return

        result = extract_text(contract.file_path, contract.file_type)
        app_logger.info(
            "parse complete: contract id=%s raw_len=%s cleaned_len=%s ocr_used=%s method=%s",
            contract.id,
            len(result.get("raw_text") or ""),
            len(result.get("cleaned_text") or ""),
            result.get("ocr_used"),
            result.get("parse_method"),
        )
        contract.extracted_text = result["raw_text"]
        contract.cleaned_text = result["cleaned_text"]
        contract.ocr_used = result["ocr_used"]
        contract.parse_method = result["parse_method"]
        contract.status = CONTRACT_STATUS_PARSED
        db.commit()
        app_logger.info("parse save committed: contract id=%s", contract.id)

        save_contract_metadata(db, contract, contract.cleaned_text or contract.extracted_text or "")
        app_logger.info("metadata save committed: contract id=%s", contract.id)

        create_clauses(contract.id, contract.cleaned_text or "", db)
        contract.status = CONTRACT_STATUS_INDEXING
        db.commit()
        app_logger.info("clause save committed: contract id=%s", contract.id)

        upsert_embeddings(contract.id, db)
        contract.status = CONTRACT_STATUS_ANALYSIS_PENDING
        db.commit()
        app_logger.info("indexing save committed: contract id=%s", contract.id)

    except Exception:
        app_logger.exception("Contract processing/parsing failed for id=%s", contract_id)
        if contract:
            saved_path = contract.file_path
            # Remove the contract record — cascades to all child rows.
            try:
                db.rollback()
                db.delete(contract)
                db.commit()
                app_logger.info("failed upload contract deleted: id=%s", contract_id)
            except Exception:
                app_logger.exception("could not delete failed contract id=%s", contract_id)
                db.rollback()
            # Remove the saved file after the DB is clean.
            if saved_path:
                try:
                    if os.path.exists(saved_path):
                        os.remove(saved_path)
                        app_logger.info("cleaned up uploaded file: %s", saved_path)
                except Exception:
                    app_logger.warning("could not remove file: %s", saved_path)
        db.close()
        return

    # ── Phase 2: OpenAI analysis ──────────────────────────────────────────────
    # Parsing succeeded, so the contract is valid and must be preserved even if
    # the AI analysis step fails (e.g. OpenAI is temporarily unavailable).
    try:
        analyze_contract(db, contract.id)
    except Exception:
        app_logger.exception("Analysis step raised unexpectedly for contract id=%s", contract_id)
        # analyze_contract manages its own status commits; if it raised before
        # reaching the final commit the contract stays in analysis_pending.
        # Roll back any partial transaction and leave the status as-is so the
        # user can trigger a re-analysis manually.
        try:
            db.rollback()
            # Re-fetch to avoid using a stale ORM object after rollback.
            stale = db.query(Contract).filter(Contract.id == contract_id).first()
            if stale and stale.status == CONTRACT_STATUS_ANALYSIS_PENDING:
                stale.status = CONTRACT_STATUS_ANALYSIS_FAILED
                stale.processing_error = "AI analysis is currently unavailable. Please try again later."
                db.commit()
        except Exception:
            app_logger.exception("could not update status after unexpected analysis failure id=%s", contract_id)
    finally:
        db.close()
