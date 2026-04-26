from sqlalchemy import Column, Integer, String, Text, ForeignKey, DateTime, Date
from sqlalchemy.orm import relationship
from datetime import datetime

from app.core.database import Base
from app.core.constants import OBLIGATION_STATUS_PENDING


class Obligation(Base):
    __tablename__ = "obligations"

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

    title = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    owner = Column(String(255), nullable=True)

    due_date = Column(Date, nullable=True)
    reminder_date = Column(Date, nullable=True)

    status = Column(String(50), nullable=False, default=OBLIGATION_STATUS_PENDING, index=True)
    source_snippet = Column(Text, nullable=True)

    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    contract = relationship("Contract", back_populates="obligations")
    clause = relationship("Clause", back_populates="obligations")
    alerts = relationship("Alert", back_populates="obligation")
    