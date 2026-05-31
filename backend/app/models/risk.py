from sqlalchemy import Column, Integer, String, Text, ForeignKey, DateTime
from sqlalchemy.orm import relationship
from datetime import datetime

from app.core.database import Base
from app.core.constants import (
    RISK_SEVERITY_MEDIUM,
    RISK_TYPE_LIABILITY,
)


class Risk(Base):
    __tablename__ = "risks"

    id = Column(Integer, primary_key=True, index=True)

    contract_id = Column(
        Integer,
        ForeignKey("contracts.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )

    clause_id = Column(
        Integer,
        ForeignKey("clauses.id", ondelete="SET NULL"),
        nullable=True,
        index=True,
    )

    risk_type = Column(String(100), nullable=False, index=True, default=RISK_TYPE_LIABILITY)
    severity = Column(String(20), nullable=False, index=True, default=RISK_SEVERITY_MEDIUM)

    title = Column(String(255), nullable=False)
    explanation = Column(Text, nullable=True)
    suggested_action = Column(Text, nullable=True)
    source_snippet = Column(Text, nullable=True)

    business_impact  = Column(Text, nullable=True)
    why_this_matters = Column(Text, nullable=True)
    trigger_terms    = Column(Text, nullable=True)

    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    contract = relationship("Contract", back_populates="risks")
    clause = relationship("Clause", back_populates="risks")
    alerts = relationship("Alert", back_populates="risk")