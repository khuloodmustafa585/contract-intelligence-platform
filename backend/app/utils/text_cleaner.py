import re

def clean_text(text: str) -> str:
    try:
        text = re.sub(r"[^\w\s.,;:()\-\n]", "", text)
        text = re.sub(r"[ \t]+", " ", text)
        return text.strip()
    except Exception as e:
        print(f"Error cleaning text: {e}")
        return ""

def normalize_text(text: str) -> str:
    try:
        return text.lower()
    except Exception as e:
        print(f"Error normalizing text: {e}")
        return ""

def remove_empty_lines(text: str) -> str:
    try:
        lines = text.splitlines()
        non_empty_lines = [line.strip() for line in lines if line.strip()]
        return "\n".join(non_empty_lines)
    except Exception as e:
        print(f"Error removing empty lines: {e}")
        return ""

def preprocess_text(text: str) -> str:
    try:
        text = remove_empty_lines(text)
        text = clean_text(text)
        text = normalize_text(text)
        return text
    except Exception as e:
        print(f"Error preprocessing text: {e}")
        return ""