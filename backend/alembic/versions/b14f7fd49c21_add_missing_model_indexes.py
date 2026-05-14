"""add missing model indexes

Revision ID: b14f7fd49c21
Revises: c6f6bfd4df66
Create Date: 2026-05-14 18:20:00.000000

"""
from typing import Sequence, Union

from alembic import op


# revision identifiers, used by Alembic.
revision: str = "b14f7fd49c21"
down_revision: Union[str, Sequence[str], None] = "c6f6bfd4df66"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_index(op.f("ix_clauses_category"), "clauses", ["category"], unique=False)
    op.create_index(op.f("ix_clauses_order_index"), "clauses", ["order_index"], unique=False)
    op.create_index(op.f("ix_contracts_effective_date"), "contracts", ["effective_date"], unique=False)
    op.create_index(op.f("ix_contracts_expiration_date"), "contracts", ["expiration_date"], unique=False)


def downgrade() -> None:
    op.drop_index(op.f("ix_contracts_expiration_date"), table_name="contracts")
    op.drop_index(op.f("ix_contracts_effective_date"), table_name="contracts")
    op.drop_index(op.f("ix_clauses_order_index"), table_name="clauses")
    op.drop_index(op.f("ix_clauses_category"), table_name="clauses")
