import re

# Characters to strip: null bytes, control characters, and replacement character.
# Preserve all printable ASCII and unicode so legal text ($, %, /, ', ", §, etc.)
# survives intact.
_CONTROL_RE = re.compile(r"[\x00-\x08\x0b\x0c\x0e-\x1f\x7f�]")
_MULTI_SPACE_RE = re.compile(r"[ \t]+")
_MULTI_NEWLINE_RE = re.compile(r"\n{3,}")


def clean_text(text: str) -> str:
    if not text:
        return ""
    text = _CONTROL_RE.sub("", text)
    text = _MULTI_SPACE_RE.sub(" ", text)
    text = _MULTI_NEWLINE_RE.sub("\n\n", text)
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
