from sqlalchemy.orm import Session
from app.models.clause import Clause


def save_clauses(db: Session, contract_id: int, clauses: list[dict]):
    if not clauses:
        return []

    db_clauses = []

    for clause in clauses:
        db_clause = Clause(
            contract_id=contract_id,
            title=clause.get("title"),
            text=clause.get("text")
        )

        db.add(db_clause)
        db_clauses.append(db_clause)

    db.commit()

    return db_clauses