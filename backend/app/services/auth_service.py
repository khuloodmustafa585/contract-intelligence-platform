from typing import Optional
from datetime import datetime, timedelta
import random

from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.core.security import hash_password, verify_password, create_access_token
from app.models.user import User
from app.schemas.user import UserCreate
from app.services.email_service import send_verification_email


def generate_verification_code() -> str:
    return str(random.randint(100000, 999999))


def get_user_by_email(db: Session, email: str) -> Optional[User]:
    return db.query(User).filter(User.email == email.lower()).first()


def register_user(db: Session, user_data: UserCreate) -> User:
    existing_user = get_user_by_email(db, user_data.email)
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered",
        )

    hashed_password = hash_password(user_data.password)
    code = generate_verification_code()

    new_user = User(
        full_name=user_data.full_name,
        email=user_data.email.lower(),
        hashed_password=hashed_password,
        verification_code=code,
        code_expires_at=datetime.utcnow() + timedelta(minutes=10),
        is_verified=True,
    )

    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    try:
        send_verification_email(new_user.email, code)
    except Exception as e:
        print(f"Email sending failed: {e}")

    return new_user


def login_user(db: Session, email: str, password: str) -> dict:
    user = get_user_by_email(db, email.lower())

    if not user or not verify_password(password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password",
        )

    if not user.is_verified:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Please verify your email first",
        )

    access_token = create_access_token(subject=user.email)

    return {
        "access_token": access_token,
        "token_type": "bearer",
    }


def verify_user_email(db: Session, email: str, code: str) -> User:
    user = get_user_by_email(db, email.lower())

    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    if user.is_verified:
        raise HTTPException(status_code=400, detail="User already verified")

    if user.verification_code != code:
        raise HTTPException(status_code=400, detail="Invalid code")

    if not user.code_expires_at or user.code_expires_at < datetime.utcnow():
        raise HTTPException(status_code=400, detail="Code expired")

    user.is_verified = True
    user.verification_code = None
    user.code_expires_at = None

    db.commit()
    db.refresh(user)

    return user


def resend_verification_email(db: Session, email: str) -> dict:
    user = get_user_by_email(db, email.lower())

    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    if user.is_verified:
        raise HTTPException(status_code=400, detail="User already verified")

    code = generate_verification_code()
    user.verification_code = code
    user.code_expires_at = datetime.utcnow() + timedelta(minutes=10)

    db.commit()
    db.refresh(user)

    try:
        send_verification_email(user.email, code)
    except Exception as e:
        print(f"Email sending failed: {e}")

    return {"msg": "Verification email resent successfully"}