from sqlalchemy.orm import Session
from app.models.clause import Clause
from app.utils.chunking import split_into_clauses
import re

def extract_heading(text: str):
    match = re.match(
        r'^(Article\s+\d+|Section\s+\d+|Clause\s+\d+|\d+\.)',
        text,
        re.IGNORECASE
    )
    if match:
        heading = match.group()
        body = text[len(heading):].strip()
        return heading, body
    return None, text

def create_clauses(contract_id: int, text: str, db: Session):
    db.query(Clause).filter(Clause.contract_id == contract_id).delete()
    db.commit()
    clauses = split_into_clauses(text)

    for index, clause_text in enumerate(clauses):
        heading, body = extract_heading(clause_text)

        clause = Clause(
            contract_id=contract_id,
            heading=heading,
            text=body,
            order_index=index
        )
        db.add(clause)

    db.commit()