from pydantic import BaseModel
from typing import Optional
from datetime import datetime

class ContractBase(BaseModel):
    title: str
    status: Optional[str] = "uploaded"

class ContractCreate(ContractBase):
    pass

class ContractResponse(ContractBase):
    contract_id: int
    owner_id: int
    extracted_text: Optional[str] = None
    created_at: Optional[datetime]
    updated_at: Optional[datetime]

    class Config:
        from_attributes = True
