from fastapi import APIRouter, HTTPException
from app.services.auth_service import (
    register_user,
    login_user,
    verify_email_token,
    resend_verification_email
)
#from app.utils.email import send_verification_email
from app.services.email_service import send_verification_email
from app.schemas.user import UserCreate

router = APIRouter()

# ✅ REGISTER
@router.post("/register")
def register(data: UserCreate):
    try:
        print("STEP 1: calling register_user")

        user = register_user(data)

        print("STEP 2: user created", user)

        send_verification_email(user.email, user.verification_token)

        print("STEP 3: email sent")

        return {"msg": "Check your email to verify your account"}

    except Exception as e:
        print("ERROR:", e)
        return {"error": str(e)}

# ✅ LOGIN
@router.post("/login")
def login(data: UserCreate):
    user = login_user(data)

    if not user.is_verified:
        raise HTTPException(status_code=403, detail="Email not verified")

    return {"msg": "login success"}

# ✅ VERIFY EMAIL
@router.get("/verify-email")
def verify_email(token: str):
    return verify_email_token(token)

# ✅ RESEND EMAIL
@router.post("/resend-verification")
def resend_verification(email: str):
    return resend_verification_email(email)


print("AUTH LOADED")