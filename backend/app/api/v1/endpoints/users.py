from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.api.deps import get_current_user
from app.core.database import get_db
from app.schemas.user import UserResponse, UserUpdate
from app.models.user import User

router = APIRouter()


@router.get("/me", response_model=UserResponse)
def get_me(current_user: User = Depends(get_current_user)):
    return current_user


@router.patch("/me", response_model=UserResponse)
def update_me(
    body: UserUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if body.full_name is not None:
        current_user.full_name = body.full_name
    if body.email_notifications_enabled is not None:
        current_user.email_notifications_enabled = body.email_notifications_enabled
    db.commit()
    db.refresh(current_user)
    return current_user
