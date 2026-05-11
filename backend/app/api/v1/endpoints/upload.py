from fastapi import APIRouter, UploadFile, File, Depends, BackgroundTasks
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.services.upload_service import handle_upload
from app.api.deps import get_current_user
from app.models.user import User

router = APIRouter()


@router.post("/")
async def upload_file(
    background_tasks: BackgroundTasks,
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    result = await handle_upload(
        file,
        db,
        current_user.id,
        background_tasks
    )

    return result