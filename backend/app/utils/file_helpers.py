from fileinput import filename

from PyPDF2 import PdfReader
from fastapi import UploadFile
from backend.app.core.constants import UPLOAD_DIR, SUPPORTED_FILE_TYPES
import os
import docx
import uuid

def generate_unique_filename(filename: str) -> str:
    ext = filename.split(".")[-1] if "." in filename else ""
    return f"{uuid.uuid4()}.{ext}"


def get_file_type(filename: str) -> str:
    return filename.split(".")[-1].lower()


def is_allowed_file(filename: str) -> bool:
    return get_file_type(filename) in SUPPORTED_FILE_TYPES

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
    
def save_file(file: UploadFile, filename:str) -> str:
    try:
        if not is_allowed_file(filename):
            return ""
        os.makedirs(UPLOAD_DIR, exist_ok=True)
        filename = generate_unique_filename(filename)
        file.file.seek(0)
        file_path = os.path.join(UPLOAD_DIR, filename)
        with open(file_path, "wb") as f:
            f.write(file.file.read())
        return file_path
    except Exception as e:
        print(f"Error saving file: {e}")
        return ""
    
    