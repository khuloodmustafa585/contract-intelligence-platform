from pydantic import BaseModel, ConfigDict
from datetime import datetime, date


class AlertResponse(BaseModel):
    id: int
    contract_id: int
    alert_type: str
    title: str
    message: str | None = None
    status: str
    created_at: datetime
    trigger_date: date | None = None

    model_config = ConfigDict(from_attributes=True)