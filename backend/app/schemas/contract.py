from pydantic import BaseModel, ConfigDict, Field
from datetime import datetime, date

from app.schemas.alert import AlertResponse

class ContractBase(BaseModel):
    title: str


class ContractCreate(ContractBase):
    pass

class ContractListResponse(ContractBase):
    """Lean schema returned by collection endpoints — no large text blobs."""
    id: int
    owner_id: int
    status: str
    processing_error: str | None = None
    effective_date: date | None = None
    expiration_date: date | None = None
    notice_period_days: int | None = None
    created_at: datetime | None = None
    updated_at: datetime | None = None
    file_name: str | None = None
    file_type: str | None = None
    ocr_used: bool
    parse_method: str | None = None
    is_indexed: bool
    embedding_status: str

    model_config = ConfigDict(from_attributes=True)


class ContractResponse(ContractListResponse):
    """Full schema including extracted text — used on the detail endpoint."""
    extracted_text: str | None = None
    cleaned_text: str | None = None
    file_path: str | None = None


class ClauseResponse(BaseModel):
    id: int
    contract_id: int
    category: str | None = None
    heading: str | None = None
    text: str
    order_index: int
    page_number: int | None = None
    source_snippet: str | None = None

    model_config = ConfigDict(from_attributes=True)


class RiskResponse(BaseModel):
    id: int
    contract_id: int
    clause_id: int | None = None
    risk_type: str
    severity: str
    title: str
    explanation: str | None = None
    suggested_action: str | None = None
    source_snippet: str | None = None
    # Per-risk AI-generated detail fields.  NULL for risks created before this
    # feature was added; the frontend falls back to type-based templates then.
    business_impact: str | None = None
    why_this_matters: str | None = None
    trigger_terms: str | None = None
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class SummaryResponse(BaseModel):
    id: int
    contract_id: int
    summary_type: str
    summary_text: str
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class ObligationResponse(BaseModel):
    id: int
    contract_id: int
    clause_id: int | None = None
    title: str
    description: str | None = None
    owner: str | None = None
    due_date: date | None = None
    reminder_date: date | None = None
    status: str
    source_snippet: str | None = None
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class ContractDetailResponse(ContractResponse):
    clauses: list[ClauseResponse] = Field(default_factory=list)
    risks: list[RiskResponse] = Field(default_factory=list)
    summaries: list[SummaryResponse] = Field(default_factory=list)
    obligations: list[ObligationResponse] = Field(default_factory=list)
    alerts: list[AlertResponse] = Field(default_factory=list)


class ObligationStatusUpdate(BaseModel):
    status: str = Field(pattern="^(pending|completed|overdue)$")


class AskAIRequest(BaseModel):
    question: str = Field(min_length=1, max_length=1000)


class AskAIResponse(BaseModel):
    clause_summary: str
    quoted_clause: str | None = None
    legal_risk: str | None = None
    recommendation: str | None = None
    confidence: str = "low"
    sources: list[dict] = Field(default_factory=list)
