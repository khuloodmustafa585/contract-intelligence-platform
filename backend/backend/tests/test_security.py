from jose import jwt
from app.core.security import hash_password, verify_password, create_access_token
from app.core.config import settings


def test_hash_password():
    password = "mypassword123"
    hashed = hash_password(password)

    assert hashed != password
    assert isinstance(hashed, str)
    assert len(hashed) > 0


def test_verify_password_correct():
    password = "mypassword123"
    hashed = hash_password(password)

    assert verify_password(password, hashed) is True


def test_verify_password_wrong():
    password = "mypassword123"
    hashed = hash_password(password)

    assert verify_password("wrongpassword", hashed) is False


def test_create_access_token():
    data = {"sub": "test@example.com"}
    token = create_access_token(data)

    assert token is not None
    assert isinstance(token, str)
    assert len(token) > 10


def test_access_token_contains_sub():
    data = {"sub": "test@example.com"}
    token = create_access_token(data)

    decoded = jwt.decode(
        token,
        settings.SECRET_KEY,
        algorithms=[settings.ALGORITHM]
    )

    assert decoded["sub"] == "test@example.com"
    assert "exp" in decoded