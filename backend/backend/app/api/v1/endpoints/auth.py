from fastapi import APIRouter, Depends, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.schemas.user import UserCreate, UserResponse
from app.schemas.auth import (
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
from app.core.rate_limit import rate_limit

router = APIRouter()


@router.post("/register", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
def register(data: UserCreate, db: Session = Depends(get_db)):
    return register_user(db, data)


@router.post("/login", response_model=Token)
def login(
    form_data: OAuth2PasswordRequestForm = Depends(),
    db: Session = Depends(get_db),
    _: None = Depends(rate_limit("login", 5, 60)),
):
    return login_user(db, form_data.username, form_data.password)


@router.post("/verify-email", response_model=UserResponse)
def verify_email(data: VerifyEmailRequest, db: Session = Depends(get_db)):
    return verify_user_email(db, data.email, data.code)


@router.post("/resend-verification")
def resend_verification(data: ResendVerificationRequest, db: Session = Depends(get_db)):
    return resend_verification_email(db, data.email)
