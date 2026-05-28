from sqlalchemy import Column, Integer, String, Boolean, DateTime
from sqlalchemy.orm import relationship
from app.core.database import Base

class User(Base):
    __tablename__ = "users"
    
    id = Column(Integer, primary_key=True, index=True)
    full_name = Column(String(255), nullable=False)
    email = Column(String(255), unique=True, index=True, nullable=False)
    hashed_password = Column(String(255), nullable=False)
    
    is_verified = Column(
        Boolean,
        default=False,
        server_default="false",
        nullable=False
    )

    email_notifications_enabled = Column(
        Boolean,
        default=True,
        server_default="true",
        nullable=False
    )

    department = Column(String(255), nullable=True)
    company = Column(String(255), nullable=True)
    avatar_url = Column(String(500), nullable=True)

    verification_code = Column(String(6), nullable=True)
    code_expires_at = Column(DateTime, nullable=True)

    contracts = relationship(
        "Contract",
        back_populates="owner",
        cascade="all, delete-orphan"
    )
    policy_rules = relationship(
        "PolicyRule",
        back_populates="owner",
        cascade="all, delete-orphan"
    )
