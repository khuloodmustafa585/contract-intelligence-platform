from PyPDF2 import PdfReader
from fastapi import UploadFile
from app.core.constants import UPLOAD_DIR, SUPPORTED_FILE_TYPES
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
    
def save_file(file: UploadFile, filename:str) -> str:
    try:
        if not filename.lower().endswith(SUPPORTED_FILE_TYPES):
            return ""
        os.makedirs(UPLOAD_DIR, exist_ok=True)
        file.file.seek(0)
        file_path = os.path.join(UPLOAD_DIR, filename)
        with open(file_path, "wb") as f:
            f.write(file.file.read())
        return file_path
    except Exception as e:
        print(f"Error saving file: {e}")
        return ""
    
    