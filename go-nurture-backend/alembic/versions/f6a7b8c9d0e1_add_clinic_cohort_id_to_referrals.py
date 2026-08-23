"""add clinic_cohort_id to referrals (second cohort slot for breastfeeding clinic)

Revision ID: f6a7b8c9d0e1
Revises: e5f6a7b8c9d0
Create Date: 2026-08-23

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'f6a7b8c9d0e1'
down_revision: Union[str, Sequence[str], None] = 'e5f6a7b8c9d0'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column(
        'referrals',
        sa.Column('clinic_cohort_id', sa.UUID(), nullable=True),
    )
    op.create_foreign_key(
        'fk_referrals_clinic_cohort_id',
        'referrals',
        'cohorts',
        ['clinic_cohort_id'],
        ['id'],
    )


def downgrade() -> None:
    op.drop_constraint('fk_referrals_clinic_cohort_id', 'referrals', type_='foreignkey')
    op.drop_column('referrals', 'clinic_cohort_id')