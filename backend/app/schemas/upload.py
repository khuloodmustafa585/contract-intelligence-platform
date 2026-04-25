from pydantic import BaseModel
from typing import Optional

class UploadResponse(BaseModel):
    id: int
    filename: str
    status: str
    message: str

class StatusResponse(BaseModel):
    contract_id: int
    status: str
    progress: Optional[int] = None
    error: Optional[str] = None 

