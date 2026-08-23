"""add mother_email, referral_type, cohort_type; make cohort end_date nullable

Revision ID: e5f6a7b8c9d0
Revises: d4e5f6a7b8c9
Create Date: 2026-08-23

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'e5f6a7b8c9d0'
down_revision: Union[str, Sequence[str], None] = 'd4e5f6a7b8c9'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Referrals: mother email + service type requested
    op.add_column('referrals', sa.Column('mother_email', sa.String(255), nullable=True))
    op.add_column(
        'referrals',
        sa.Column('referral_type', sa.String(100), nullable=False, server_default='birth_confidence'),
    )

    # Cohorts: program type + optional end date (clinic type has no end date)
    op.add_column(
        'cohorts',
        sa.Column('cohort_type', sa.String(100), nullable=False, server_default='birth_confidence'),
    )
    op.alter_column('cohorts', 'end_date', existing_type=sa.Date(), nullable=True)


def downgrade() -> None:
    op.alter_column('cohorts', 'end_date', existing_type=sa.Date(), nullable=False)
    op.drop_column('cohorts', 'cohort_type')
    op.drop_column('referrals', 'referral_type')
    op.drop_column('referrals', 'mother_email')