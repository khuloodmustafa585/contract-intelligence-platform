from app.core.config import settings
from app.core.security import hash_password, verify_password, create_access_token
from app.core.database import SessionLocal, engine, Base


def test_settings_loaded():
    assert settings.PROJECT_NAME is not None
    assert settings.SECRET_KEY is not None
    assert settings.ALGORITHM == "HS256"


def test_hash_password():
    password = "mypassword123"
    hashed = hash_password(password)

    assert hashed != password
    assert verify_password(password, hashed) is True
    assert verify_password("wrongpassword", hashed) is False


def test_create_access_token():
    data = {"sub": "test@example.com"}
    token = create_access_token(data)

    assert token is not None
    assert isinstance(token, str)
    assert len(token) > 10


def test_database_session():
    db = SessionLocal()
    try:
        assert db is not None
    finally:
        db.close()


def test_database_engine():
    assert engine is not None