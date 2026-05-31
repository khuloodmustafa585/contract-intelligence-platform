from sqlalchemy import Column, Integer, String, Text, ForeignKey, DateTime, Date, Boolean
from sqlalchemy.orm import relationship
from datetime import datetime

from app.core.database import Base
from app.core.constants import (
    CONTRACT_STATUS_UPLOADED,
    EMBEDDING_STATUS_PENDING,
)


class Contract(Base):
    __tablename__ = "contracts"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(255), nullable=False)
    status = Column(
        String(50),
        nullable=False,
        default=CONTRACT_STATUS_UPLOADED,
        index=True,
    )

    extracted_text = Column(Text, nullable=True)
    cleaned_text = Column(Text, nullable=True)

    processing_error = Column(Text, nullable=True)

    effective_date = Column(Date, nullable=True, index=True)
    expiration_date = Column(Date, nullable=True, index = True)
    notice_period_days = Column(Integer, nullable=True)

    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    owner_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)

    file_name = Column(String(255), nullable = True)
    file_path = Column(String(500), nullable=True, unique=True)
    file_type = Column(String(50), nullable=True)

    is_indexed = Column(Boolean, nullable=False, default=False)
    embedding_status = Column(
        String(50),
        nullable=False,
        default=EMBEDDING_STATUS_PENDING,
    )    
    
    extracted_metadata_json = Column(Text, nullable=True)

    ocr_used = Column(Boolean, nullable=False, default=False)
    parse_method= Column(String(20), nullable=True)

    owner = relationship("User", back_populates="contracts")
    clauses = relationship("Clause", back_populates="contract", cascade="all, delete-orphan")
    risks = relationship("Risk", back_populates="contract", cascade="all, delete-orphan")
    summaries = relationship("Summary", back_populates="contract", cascade="all, delete-orphan")
    obligations = relationship("Obligation", back_populates="contract", cascade="all, delete-orphan")
    alerts = relationship("Alert", back_populates="contract", cascade="all, delete-orphan")