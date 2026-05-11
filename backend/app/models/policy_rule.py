from sqlalchemy import (
    Column,
    Integer,
    String,
    Text,
    Boolean,
    DateTime,
    ForeignKey,
)
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship

from app.core.database import Base


class PolicyRule(Base):
    __tablename__ = "policy_rules"

    id = Column(Integer, primary_key=True, index=True)

    owner_id = Column(
        Integer,
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
    )

    clause_category = Column(String, nullable=False)

    rule_name = Column(String, nullable=False)

    description = Column(Text, nullable=True)

    expected_condition = Column(Text, nullable=False)

    severity = Column(String, nullable=False)

    recommendation = Column(Text, nullable=True)

    is_active = Column(Boolean, default=True)

    created_at = Column(DateTime(timezone=True), server_default=func.now())

    owner = relationship(
        "User",
        back_populates="policy_rules"
    )