from pydantic import BaseModel

class UploadResponse(BaseModel):
    file_name: str
    file_path: str
    file_type: str
    message: str