from sqlalchemy import Column, Integer, String, Text, ForeignKey
from app.core.database import Base


class Clause(Base):
    __tablename__ = "clauses"

    id = Column(Integer, primary_key=True, index=True)

    contract_id = Column(Integer, ForeignKey("contracts.id"), nullable=False)

    title = Column(String, nullable=True)
    text = Column(Text, nullable=False)