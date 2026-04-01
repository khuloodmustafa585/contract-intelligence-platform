from pydantic import BaseModel, ConfigDict
from datetime import datetime


class ContractBase(BaseModel):
    title: str
    status: str = "uploaded"


class ContractCreate(ContractBase):
    pass


class ContractResponse(ContractBase):
    id: int
    owner_id: int
    extracted_text: str | None = None
    created_at: datetime | None = None
    updated_at: datetime | None = None

    model_config = ConfigDict(from_attributes=True)