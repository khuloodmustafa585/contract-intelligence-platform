from pydantic import BaseModel, ConfigDict
from datetime import datetime, date


class ContractBase(BaseModel):
    title: str


class ContractCreate(ContractBase):
    pass


class ContractResponse(ContractBase):
    id: int
    owner_id: int

    status: str
    processing_error: str | None = None

    extracted_text: str | None = None
    cleaned_text: str | None = None

    effective_date: date | None = None
    expiration_date: date | None = None
    notice_period_days: int | None = None

    file_name: str | None = None
    file_path: str | None = None
    file_type: str | None = None

    ocr_used: bool = False
    parse_method: str | None = None

    is_indexed: bool = False
    embedding_status: str = "pending"

    created_at: datetime | None = None
    updated_at: datetime | None = None

    model_config = ConfigDict(from_attributes=True)


class ContractStatusResponse(BaseModel):
    id: int
    title: str
    status: str
    processing_error: str | None = None
    