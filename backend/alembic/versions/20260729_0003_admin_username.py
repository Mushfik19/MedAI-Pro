"""Add optional username identity for administrator authentication.

Revision ID: 20260729_0003
Revises: 20260728_0002
Create Date: 2026-07-29 00:03:00
"""

from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op

revision: str = "20260729_0003"
down_revision: str | None = "20260728_0002"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.add_column("users", sa.Column("username", sa.String(length=64), nullable=True))
    op.create_unique_constraint("uq_users_username", "users", ["username"])


def downgrade() -> None:
    op.drop_constraint("uq_users_username", "users", type_="unique")
    op.drop_column("users", "username")
