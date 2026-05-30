"""add first_name last_name job_title to users

Revision ID: b7c8d9e0f1a2
Revises: f1a2b3c4d5e6
Create Date: 2026-05-29 00:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "b7c8d9e0f1a2"
down_revision: Union[str, Sequence[str], None] = "f1a2b3c4d5e6"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column("users", sa.Column("first_name", sa.String(length=255), nullable=True))
    op.add_column("users", sa.Column("last_name",  sa.String(length=255), nullable=True))
    op.add_column("users", sa.Column("job_title",  sa.String(length=255), nullable=True))


def downgrade() -> None:
    op.drop_column("users", "job_title")
    op.drop_column("users", "last_name")
    op.drop_column("users", "first_name")
