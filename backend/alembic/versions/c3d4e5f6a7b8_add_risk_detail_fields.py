"""add business_impact, why_this_matters, trigger_terms to risks

Revision ID: c3d4e5f6a7b8
Revises: b7c8d9e0f1a2
Create Date: 2026-05-29 00:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "c3d4e5f6a7b8"
down_revision: Union[str, Sequence[str], None] = "b7c8d9e0f1a2"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column("risks", sa.Column("business_impact",  sa.Text(), nullable=True))
    op.add_column("risks", sa.Column("why_this_matters", sa.Text(), nullable=True))
    op.add_column("risks", sa.Column("trigger_terms",    sa.Text(), nullable=True))


def downgrade() -> None:
    op.drop_column("risks", "trigger_terms")
    op.drop_column("risks", "why_this_matters")
    op.drop_column("risks", "business_impact")
