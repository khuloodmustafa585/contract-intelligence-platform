from sqlalchemy import text
from app.core.database import SessionLocal, engine


def test_database_connection():
    db = SessionLocal()
    try:
        result = db.execute(text("SELECT 1"))
        value = result.scalar()
        assert value == 1
    finally:
        db.close()


def test_engine_exists():
    assert engine is not None