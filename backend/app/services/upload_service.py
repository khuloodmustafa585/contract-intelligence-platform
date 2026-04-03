import os
import uuid
from fastapi import UploadFile, HTTPException
from sqlalchemy.orm import Session
from app.models.contract import Contract

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

    unique_filename = generate_unique_filename(file_ext)

    os.makedirs(UPLOAD_DIR, exist_ok=True)
    file_path = os.path.join(UPLOAD_DIR, unique_filename)

    save_file(file_path, contents)

    contract = Contract(
        title=file.filename,
        status="uploaded",
        owner_id=user_id
    )

    db.add(contract)
    db.commit()
    db.refresh(contract)

    return {
        "id": contract.id,
        "title": contract.title,
        "status": contract.status,
        "message": "File uploaded and saved successfully"
    }