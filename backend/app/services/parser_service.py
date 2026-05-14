from concurrent.futures import ThreadPoolExecutor, TimeoutError as FutureTimeout
import pytesseract

pytesseract.pytesseract.tesseract_cmd = r"C:\Program Files\Tesseract-OCR\tesseract.exe"

from app.utils.text_cleaner import clean_text

PARSER_TIMEOUT_SECONDS = 45

def extract_text_from_pdf(file_path: str) -> str:
    try:
        import fitz

        text = ""
        document = fitz.open(file_path)

        for page in document:
            text += page.get_text()

        document.close()
        if not text.strip():
            return extract_text_from_image(file_path)
        return text.strip()
    except Exception as e:
        raise Exception(f"PDF parsing failed: {str(e)}")

def extract_text_from_docx(file_path: str) -> str:
    try:
        import docx

        text = ""

        document = docx.Document(file_path)

        for para in document.paragraphs:
            text += para.text + "\n"

        return text.strip() if text else ""

    except Exception as e:
        raise Exception(f"DOCX parsing failed: {str(e)}")

def extract_text_from_image(file_path: str) -> str:
    try:
        import pytesseract
        from PIL import Image

        image = Image.open(file_path)
        text = pytesseract.image_to_string(image)
        return text.strip()
    except Exception as e:
        raise Exception(f"Image parsing failed: {str(e)}")

def _extract_text(file_path: str, file_type: str) -> str:
    if file_type == "pdf":
        return extract_text_from_pdf(file_path)
    elif file_type == "docx":
        return extract_text_from_docx(file_path)
    elif file_type in ["jpg", "jpeg", "png"]:
        return extract_text_from_image(file_path)
    else:
        raise ValueError("Unsupported file type for text extraction")


def extract_text(file_path: str, file_type: str, timeout_seconds: int = PARSER_TIMEOUT_SECONDS) -> dict:
    with ThreadPoolExecutor(max_workers=1) as executor:
        future = executor.submit(_extract_text, file_path, file_type)
        try:
            raw_text = future.result(timeout=timeout_seconds)
        except FutureTimeout:
            raise TimeoutError("Text extraction timed out")

    return {
        "raw_text": raw_text,
        "cleaned_text": clean_text(raw_text or ""),
        "ocr_used": file_type in {"jpg", "jpeg", "png"} or not raw_text.strip(),
        "parse_method": "ocr" if file_type in {"jpg", "jpeg", "png"} else file_type,
    }
