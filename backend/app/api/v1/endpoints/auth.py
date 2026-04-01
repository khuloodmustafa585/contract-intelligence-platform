from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.schemas.user import UserCreate, UserResponse
from app.schemas.auth import (
    LoginRequest,
    Token,
    VerifyEmailRequest,
    ResendVerificationRequest,
)
from app.services.auth_service import (
    register_user,
    login_user,
    verify_user_email,
    resend_verification_email,
)

router = APIRouter()


@router.post("/register", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
def register(data: UserCreate, db: Session = Depends(get_db)):
    return register_user(db, data)


@router.post("/login", response_model=Token)
def login(data: LoginRequest, db: Session = Depends(get_db)):
    return login_user(db, data.email, data.password)


@router.post("/verify-email", response_model=UserResponse)
def verify_email(data: VerifyEmailRequest, db: Session = Depends(get_db)):
    return verify_user_email(db, data.email, data.code)


@router.post("/resend-verification")
def resend_verification(data: ResendVerificationRequest, db: Session = Depends(get_db)):
    return resend_verification_email(db, data.email)