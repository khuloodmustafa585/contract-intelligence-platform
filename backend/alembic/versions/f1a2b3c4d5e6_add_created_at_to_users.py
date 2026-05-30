"""add created_at to users

Revision ID: f1a2b3c4d5e6
Revises: c6f6bfd4df66
Create Date: 2026-05-29 00:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = 'f1a2b3c4d5e6'
down_revision: Union[str, Sequence[str], None] = 'c6f6bfd4df66'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column(
        'users',
        sa.Column(
            'created_at',
            sa.DateTime(),
            nullable=True,
            server_default=sa.text('now()'),
        ),
    )


def downgrade() -> None:
    op.drop_column('users', 'created_at')
