"""merge migration heads

Revision ID: 6b0db372272c
Revises: c3d4e5f6a7b8, e4f9a3b2c1d0
Create Date: 2026-05-29 23:46:41.472240

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '6b0db372272c'
down_revision: Union[str, Sequence[str], None] = ('c3d4e5f6a7b8', 'e4f9a3b2c1d0')
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    pass


def downgrade() -> None:
    """Downgrade schema."""
    pass
