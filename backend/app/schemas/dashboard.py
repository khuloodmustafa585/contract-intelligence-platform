from pydantic import BaseModel, ConfigDict, Field
from datetime import datetime


class RecentUpload(BaseModel):
    id: int
    title: str
    status: str
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class DashboardResponse(BaseModel):
    total_contracts: int
    high_risk_contracts: int

    expiring_soon: int
    overdue_contracts: int

    upcoming_obligations: int
    overdue_obligations: int

    unread_alerts: int

    recent_uploads: list[RecentUpload] = Field(default_factory=list)

    model_config = ConfigDict(from_attributes=True)