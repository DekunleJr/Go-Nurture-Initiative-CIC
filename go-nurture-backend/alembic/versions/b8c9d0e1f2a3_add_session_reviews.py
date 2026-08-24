"""add session_reviews table

Revision ID: b8c9d0e1f2a3
Revises: a7b8c9d0e1f2
Create Date: 2026-08-24

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects.postgresql import JSONB, UUID


# revision identifiers, used by Alembic.
revision: str = 'b8c9d0e1f2a3'
down_revision: Union[str, Sequence[str], None] = 'a7b8c9d0e1f2'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        'session_reviews',
        sa.Column('id', UUID(as_uuid=True), primary_key=True),
        sa.Column('cohort_id', UUID(as_uuid=True), sa.ForeignKey('cohorts.id'), nullable=False),
        sa.Column('facilitator_id', UUID(as_uuid=True), sa.ForeignKey('facilitators.id'), nullable=False),
        sa.Column('session_date', sa.DateTime(timezone=True), nullable=False),
        sa.Column('week_number', sa.Integer(), nullable=True),
        sa.Column('mode', sa.String(50), nullable=True),
        sa.Column('venue_or_platform', sa.String(255), nullable=True),
        sa.Column('lead_facilitator', sa.String(255), nullable=True),
        sa.Column('co_facilitator', sa.String(255), nullable=True),
        sa.Column('start_time', sa.String(50), nullable=True),
        sa.Column('finish_time', sa.String(50), nullable=True),
        sa.Column('registered_count', sa.Integer(), nullable=True),
        sa.Column('attended_count', sa.Integer(), nullable=True),
        sa.Column('supporter_count', sa.Integer(), nullable=True),
        sa.Column('reasonable_adjustments', sa.Text(), nullable=True),
        sa.Column('fidelity_checked', JSONB(), nullable=True, server_default=sa.text("'[]'::jsonb")),
        sa.Column('quality_ratings', JSONB(), nullable=True, server_default=sa.text("'{}'::jsonb")),
        sa.Column('deviations', sa.Text(), nullable=True),
        sa.Column('incidents', JSONB(), nullable=True, server_default=sa.text("'[]'::jsonb")),
        sa.Column('reflection', JSONB(), nullable=True, server_default=sa.text("'{}'::jsonb")),
        sa.Column('status', sa.String(20), nullable=False, server_default='draft'),
        sa.Column('submitted_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
    )


def downgrade() -> None:
    op.drop_table('session_reviews')