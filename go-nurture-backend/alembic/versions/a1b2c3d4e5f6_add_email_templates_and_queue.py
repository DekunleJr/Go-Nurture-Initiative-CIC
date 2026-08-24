"""Add versioned email templates and durable email queue.

Revision ID: a1b2c3d4e5f6
Revises: f7a8b9c0d1e2
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects.postgresql import UUID


revision: str = "a1b2c3d4e5f6"
down_revision: Union[str, Sequence[str], None] = "f7a8b9c0d1e2"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "email_templates",
        sa.Column("id", UUID(as_uuid=True), nullable=False),
        sa.Column("template_key", sa.String(100), nullable=False),
        sa.Column("name", sa.String(255), nullable=False),
        sa.Column("subject", sa.String(500), nullable=False),
        sa.Column("body", sa.Text(), nullable=False),
        sa.Column("version", sa.Integer(), nullable=False, server_default="1"),
        sa.Column("is_active", sa.Boolean(), nullable=False, server_default=sa.true()),
        sa.Column("created_by", sa.String(255), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=True),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("template_key", "version", name="uq_email_template_version"),
    )
    op.create_index("ix_email_templates_template_key", "email_templates", ["template_key"])
    op.create_table(
        "email_queue",
        sa.Column("id", UUID(as_uuid=True), nullable=False),
        sa.Column("template_key", sa.String(100), nullable=False),
        sa.Column("recipient_email", sa.String(255), nullable=False),
        sa.Column("subject", sa.String(500), nullable=False),
        sa.Column("body", sa.Text(), nullable=False),
        sa.Column("status", sa.String(20), nullable=False, server_default="pending"),
        sa.Column("attempts", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("max_attempts", sa.Integer(), nullable=False, server_default="3"),
        sa.Column("next_attempt_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("last_error", sa.Text(), nullable=True),
        sa.Column("sent_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=True),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_email_queue_template_key", "email_queue", ["template_key"])
    op.create_index("ix_email_queue_status", "email_queue", ["status"])
    op.create_index("ix_email_queue_next_attempt_at", "email_queue", ["next_attempt_at"])


def downgrade() -> None:
    op.drop_index("ix_email_queue_next_attempt_at", table_name="email_queue")
    op.drop_index("ix_email_queue_status", table_name="email_queue")
    op.drop_index("ix_email_queue_template_key", table_name="email_queue")
    op.drop_table("email_queue")
    op.drop_index("ix_email_templates_template_key", table_name="email_templates")
    op.drop_table("email_templates")