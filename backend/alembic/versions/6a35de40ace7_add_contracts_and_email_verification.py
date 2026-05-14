"""add contracts and email verification fields

Revision ID: 6a35de40ace7
Revises: d2ae36960eb8
Create Date: 2026-04-01 13:59:25.455681

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = "6a35de40ace7"
down_revision: Union[str, Sequence[str], None] = "d2ae36960eb8"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column(
        "users",
        sa.Column("is_verified", sa.Boolean(), server_default=sa.text("false"), nullable=False),
    )
    op.add_column("users", sa.Column("verification_code", sa.String(length=6), nullable=True))
    op.add_column("users", sa.Column("code_expires_at", sa.DateTime(), nullable=True))

    op.create_table(
        "contracts",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("title", sa.String(length=255), nullable=False),
        sa.Column("status", sa.String(length=50), nullable=False, server_default="uploaded"),
        sa.Column("extracted_text", sa.Text(), nullable=True),
        sa.Column("effective_date", sa.Date(), nullable=True),
        sa.Column("expiration_date", sa.Date(), nullable=True),
        sa.Column("notice_period_days", sa.Integer(), nullable=True),
        sa.Column("created_at", sa.DateTime(), nullable=False),
        sa.Column("updated_at", sa.DateTime(), nullable=False),
        sa.Column("owner_id", sa.Integer(), nullable=False),
        sa.ForeignKeyConstraint(["owner_id"], ["users.id"]),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_contracts_id"), "contracts", ["id"], unique=False)
    op.create_index(op.f("ix_contracts_owner_id"), "contracts", ["owner_id"], unique=False)


def downgrade() -> None:
    op.drop_index(op.f("ix_contracts_owner_id"), table_name="contracts")
    op.drop_index(op.f("ix_contracts_id"), table_name="contracts")
    op.drop_table("contracts")

    op.drop_column("users", "code_expires_at")
    op.drop_column("users", "verification_code")
    op.drop_column("users", "is_verified")
