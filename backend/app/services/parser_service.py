import pytesseract
import fitz 
import docx
from PIL import Image

#pytesseract.pytesseract.tesseract_cmd = r"D:\OCR\tesseract.exe"
#print(pytesseract.get_tesseract_version())

def extract_text_from_pdf(file_path: str) -> str:
    try:
        text = ""
        document = fitz.open(file_path)

        for page in document:
            text += page.get_text()

        document.close()
        if not text.strip():
            return extract_text_from_image(file path)
        return text.strip()
    except Exception as e:
        raise Exception(f"PDF parsing failed: {str(e)}")

def extract_text_from_docx(file_path: str) -> str:
    try:
        text = ""

        document = docx.Document(file_path)

        for para in document.paragraphs:
            text += para.text + "\n"

        return text.strip() if text else ""

    except Exception as e:
        raise Exception(f"DOCX parsing failed: {str(e)}")

def extract_text_from_image(file_path: str) -> str:
    try:
        image = Image.open(file_path)
        text = pytesseract.image_to_string(image)
        return text.strip()
    except Exception as e:
        raise Exception(f"Image parsing failed: {str(e)}")

def extract_text(file_path: str, file_type: str) -> str:
    if file_type == "pdf":
        return extract_text_from_pdf(file_path)
    elif file_type == "docx":
        return extract_text_from_docx(file_path)
    elif file_type in ["jpg", "jpeg", "png"]:
        return extract_text_from_image(file_path)
    else:
        raise ValueError("Unsupported file type for text extraction")