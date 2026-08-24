"""Add indexes for common relationship and filtering queries.

Revision ID: f7a8b9c0d1e2
Revises: 6234b8e0d825, b8c9d0e1f2a3
Create Date: 2026-08-24

"""
from typing import Sequence, Union

from alembic import op


revision: str = "f7a8b9c0d1e2"
down_revision: Union[str, Sequence[str], None] = ("6234b8e0d825", "b8c9d0e1f2a3")
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


INDEXES = (
    ("ix_referrals_partner_id", "referrals", ("partner_id",)),
    ("ix_referrals_cohort_id", "referrals", ("cohort_id",)),
    ("ix_referrals_clinic_cohort_id", "referrals", ("clinic_cohort_id",)),
    ("ix_referrals_status", "referrals", ("status",)),
    ("ix_cohorts_facilitator_id", "cohorts", ("facilitator_id",)),
    ("ix_cohorts_venue_id", "cohorts", ("venue_id",)),
    ("ix_session_reviews_cohort_id", "session_reviews", ("cohort_id",)),
    ("ix_session_reviews_facilitator_id", "session_reviews", ("facilitator_id",)),
    ("ix_session_reviews_status", "session_reviews", ("status",)),
    ("ix_community_partners_name", "community_partners", ("name",)),
)


def upgrade() -> None:
    for index_name, table_name, columns in INDEXES:
        op.create_index(index_name, table_name, list(columns), unique=False)


def downgrade() -> None:
    for index_name, table_name, _ in reversed(INDEXES):
        op.drop_index(index_name, table_name=table_name)
