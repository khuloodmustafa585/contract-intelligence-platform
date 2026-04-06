import re

def clean_text(text: str) -> str:
    if not text:
        return ""

    text = re.sub(r"[^\w\s.,;:()\-/%$&\n]", "", text)
    text = re.sub(r"[ \t]+", " ", text)
    text = re.sub(r"\n+", "\n", text)
    text = re.sub(r"Page\s*\d+(\s*of\s*\d+)?", "", text, flags=re.IGNORECASE)
    text = re.sub(r"\n\s*\d+\s*\n", "\n", text)
    text = re.sub(r"(confidential|copyright|all rights reserved)", "", text, flags=re.IGNORECASE)
    return text.strip()

def remove_repeated_lines(text: str) -> str:
    lines = text.splitlines()
    seen = set()
    result = []

    for line in lines:
        clean_line = line.strip()
        if clean_line and (clean_line not in seen or len(clean_line) > 100):
            seen.add(clean_line)
            result.append(clean_line)

    return "\n".join(result)

def normalize_text(text: str) -> str:
    if not text:
        return ""
    return text

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
    text = remove_repeated_lines(text)
    text = clean_text(text)
    text = normalize_text(text)
    return text
