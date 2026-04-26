from sqlalchemy import Column, Integer, String, Text, ForeignKey, DateTime, Boolean, Date
from sqlalchemy.orm import relationship
from datetime import datetime

from app.core.database import Base
from app.core.constants import ALERT_STATUS_UNREAD


class Alert(Base):
    __tablename__ = "alerts"

    id = Column(Integer, primary_key=True, index=True)

    contract_id = Column(
        Integer,
        ForeignKey("contracts.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )

    obligation_id = Column(
        Integer,
        ForeignKey("obligations.id", ondelete="SET NULL"),
        nullable=True,
        index=True,
    )

    risk_id = Column(
        Integer,
        ForeignKey("risks.id", ondelete="SET NULL"),
        nullable=True,
        index=True,
    )

    alert_type = Column(String(50), nullable=False, index=True)
    title = Column(String(255), nullable=False)
    message = Column(Text, nullable=True)

    trigger_date = Column(Date, nullable=True)

    status = Column(String(50), nullable=False, default=ALERT_STATUS_UNREAD, index=True)

    send_email = Column(Boolean, nullable=False, default=False)
    recipient_email = Column(String(255), nullable=True)
    email_sent = Column(Boolean, nullable=False, default=False)
    email_sent_at = Column(DateTime, nullable=True)
    email_error = Column(Text, nullable=True)

    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    contract = relationship("Contract", back_populates="alerts")
    obligation = relationship("Obligation", back_populates="alerts")
    risk = relationship("Risk", back_populates="alerts")
