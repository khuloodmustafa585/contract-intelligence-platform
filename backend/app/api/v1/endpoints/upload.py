from fastapi import APIRouter, UploadFile, File, Depends, BackgroundTasks
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.services.upload_service import handle_upload
from app.api.deps import get_current_user
from app.models.user import User
from app.schemas.upload import UploadResponse

router = APIRouter()


@router.post("/", response_model=UploadResponse)
async def upload_file(
    background_tasks: BackgroundTasks,
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    result = await handle_upload(file, db, current_user.id, background_tasks)

    return {
        "contract_id": result["id"],
        "filename": result["file_name"],
        "status": result["status"],
        "message": "uploaded"
    }