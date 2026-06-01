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

#تحديث حالة الالتزام (Obligation Status) ثم حفظ التغيير في قاعدة البيانات وإرجاع النسخة المحدثة.
@router.patch("/me", response_model=UserResponse)
def update_me(
    body: UserUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    # --- Structured name fields ---
    if body.first_name is not None:
        current_user.first_name = body.first_name.strip() or None

    if body.last_name is not None:
        current_user.last_name = body.last_name.strip() or None

    if body.job_title is not None:
        current_user.job_title = body.job_title.strip() or None

    # Recompute full_name when first/last change, so display remains consistent.
    if body.first_name is not None or body.last_name is not None:
        fn = (current_user.first_name or "").strip()
        ln = (current_user.last_name  or "").strip()
        computed = f"{fn} {ln}".strip()
        if computed:
            current_user.full_name = computed

    # --- Legacy full_name override (settings page sends this directly) ---
    if body.full_name is not None:
        current_user.full_name = body.full_name

    # --- Other profile fields ---
    if body.email_notifications_enabled is not None:
        current_user.email_notifications_enabled = body.email_notifications_enabled
    if body.department is not None:
        current_user.department = body.department or None
    if body.company is not None:
        current_user.company = body.company or None
    if body.avatar_url is not None:
        current_user.avatar_url = body.avatar_url or None

    db.commit()
    db.refresh(current_user)
    return current_user
