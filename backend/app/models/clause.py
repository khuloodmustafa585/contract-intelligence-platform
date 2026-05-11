from sqlalchemy import Column, Integer, String, Text, ForeignKey
from sqlalchemy.orm import relationship
from app.core.database import Base


class Clause(Base):
    __tablename__ = "clauses"

    id = Column(Integer, primary_key=True, index=True)

    contract_id = Column(
        Integer,
        ForeignKey("contracts.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )

    category = Column(String(100), nullable=True)
    heading = Column(String(255), nullable=True)

    text = Column(Text, nullable=False)
    order_index = Column(Integer, nullable=False, default=0)

    page_number = Column(Integer, nullable=True)
    source_snippet = Column(Text, nullable=True)

    contract = relationship("Contract", back_populates="clauses")
    obligations = relationship("Obligation", back_populates="clause")
    risks = relationship("Risk", back_populates="clause")