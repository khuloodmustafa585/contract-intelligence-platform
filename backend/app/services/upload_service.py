import os
import uuid
from fastapi import UploadFile, HTTPException
from sqlalchemy.orm import Session
from app.models.contract import Contract
from app.services.parser_service import extract_text
from app.utils.text_cleaner import preprocess_text
from app.utils.chunking import split_by_clauses
from app.services.clause_service import save_clauses

ALLOWED_EXTENSIONS = {"pdf", "docx", "jpg", "jpeg", "png"}

MAX_FILE_SIZE = 10 * 1024 * 1024  # bytes

UPLOAD_DIR = "uploads"


def validate_file(file: UploadFile):
    file_ext = file.filename.split(".")[-1].lower()
    if file_ext not in ALLOWED_EXTENSIONS:
        raise HTTPException(status_code=400, detail="Unsupported file type")

    return file_ext


async def validate_size(file: UploadFile):
    contents = await file.read()
    if len(contents) > MAX_FILE_SIZE:
        raise HTTPException(status_code=400, detail="File too large")
    return contents


def generate_unique_filename(file_ext: str):
    return f"{uuid.uuid4()}.{file_ext}"


def save_file(file_path: str, contents: bytes):
    with open(file_path, "wb") as f:
        f.write(contents)


async def handle_upload(file: UploadFile, db: Session, user_id: int):
    file_ext = validate_file(file)

    contents = await validate_size(file)
    await file.seek(0)
    unique_filename = generate_unique_filename(file_ext)

    os.makedirs(UPLOAD_DIR, exist_ok=True)
    file_path = os.path.join(UPLOAD_DIR, unique_filename)

    save_file(file_path, contents)

    parse_method = "ocr" if file_ext in ["jpg", "jpeg", "png"] else "direct"

    contract = Contract(
        title=os.path.splitext(file.filename)[0],
        file_name=unique_filename,
        file_path=file_path,
        file_type=file_ext,
        status="uploaded",
        owner_id=user_id,
        parse_method=parse_method
    )

    db.add(contract)
    db.commit()
    db.refresh(contract)

    extracted_text = extract_text(file_path, file_ext)
    cleaned_text = preprocess_text(extracted_text)
    clauses = split_by_clauses(cleaned_text)

    save_clauses(db, contract.id, clauses)
    
    contract.extracted_text = extracted_text
    contract.cleaned_text = cleaned_text
    contract.status = "parsed"
    contract.ocr_used = (parse_method == "ocr") 

    db.commit()

    return {
        "id": contract.id,
        "title": contract.title,
        "status": contract.status,
        "message": "File uploaded and saved successfully"
    }