from PyPDF2 import PdfReader
from fastapi import UploadFile
from app.core.constants import UPLOAD_DIR, SUPPORTED_FILE_TYPES, MAX_FILE_SIZE_MB
import os
import docx

def read_pdf(file_path: str) -> str:
    try:
        reader = PdfReader(file_path)
        text = ""
        for page in reader.pages:
            page_text = page.extract_text()
            if page_text:
                text += page_text + "\n"
        return text.strip()
    except Exception as e:
        print(f"Error reading PDF: {e}")
        return ""
    
def read_docx(file_path: str) -> str:
    try:
        doc = docx.Document(file_path)
        return "\n".join([para.text for para in doc.paragraphs])
    except Exception as e:        
        print(f"Error reading DOCX: {e}")
        return ""
    
def save_file(file: UploadFile) -> str:
    try:
        filename = file.filename or ""
        if not filename.lower().endswith(SUPPORTED_FILE_TYPES):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Unsupported file type",
            )

        os.makedirs(UPLOAD_DIR, exist_ok=True)

        file.file.seek(0, os.SEEK_END)
        file_size = file.file.tell()
        file.file.seek(0)

        max_size_bytes = MAX_FILE_SIZE_MB * 1024 * 1024
        if file_size > max_size_bytes:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="File is too large",
            )

        ext = os.path.splitext(filename)[1]
        unique_name = f"{uuid.uuid4()}{ext}"
        file_path = os.path.join(UPLOAD_DIR, unique_name)

        with open(file_path, "wb") as f:
            f.write(file.file.read())

        return file_path
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error saving file: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to save file",
        )
    
