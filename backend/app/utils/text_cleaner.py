import re

def clean_text(text: str) -> str:
    if not text:
        return ""

    text = re.sub(r"[^\w\s.,;:()\-\n]", "", text)
    text = re.sub(r"[ \t]+", " ", text)
    return text.strip()

def normalize_text(text: str) -> str:
    if not text:
        return ""
    return text.lower()

def remove_empty_lines(text: str) -> str:
    if not text:
        return ""

    lines = text.splitlines()
    non_empty_lines = [line.strip() for line in lines if line.strip()]
    return "\n".join(non_empty_lines)

def preprocess_text(text: str) -> str:
    if not text:
        return ""

    text = remove_empty_lines(text)
    text = clean_text(text)
    text = normalize_text(text)
    return text
