from pydantic import BaseModel, ConfigDict
from datetime import datetime, date


class ContractBase(BaseModel):
    title: str


class ContractCreate(BaseModel):
    title: str


class ContractResponse(ContractBase):
    id: int
    owner_id: int
    status: str
    extracted_text: str | None = None
    effective_date: date | None = None
    expiration_date: date | None = None
    notice_period_days: int | None = None
    created_at: datetime | None = None
    updated_at: datetime | None = None

    model_config = ConfigDict(from_attributes=True)