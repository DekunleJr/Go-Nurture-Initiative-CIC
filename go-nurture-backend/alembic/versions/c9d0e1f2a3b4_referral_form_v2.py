"""referral form v2: referrer details, safe-contact, barriers, reference number

Revision ID: c9d0e1f2a3b4
Revises: a1b2c3d4e5f6
Create Date: 2026-11-14

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects.postgresql import JSONB


# revision identifiers, used by Alembic.
revision: str = 'c9d0e1f2a3b4'
down_revision: Union[str, Sequence[str], None] = 'a1b2c3d4e5f6'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None

NEW_COLUMNS = [
    sa.Column('reference_number', sa.String(32), nullable=True),
    sa.Column('referrer_name', sa.String(255), nullable=True),
    sa.Column('referrer_email', sa.String(255), nullable=True),
    sa.Column('referrer_phone', sa.String(50), nullable=True),
    sa.Column('preferred_name', sa.String(255), nullable=True),
    sa.Column('safe_contact_method', sa.String(20), nullable=True),
    sa.Column('voicemail_ok', sa.String(20), nullable=True),
    sa.Column('communication_restrictions', sa.Text(), nullable=True),
    sa.Column('locality', sa.String(255), nullable=True),
    sa.Column('postcode_area', sa.String(20), nullable=True),
    sa.Column('gestation_info', sa.String(100), nullable=True),
    sa.Column('can_attend_course', sa.String(20), nullable=True),
    sa.Column('timing_notes', sa.Text(), nullable=True),
    sa.Column('baby_born', sa.String(20), nullable=True),
    sa.Column('baby_age_or_due', sa.String(100), nullable=True),
    sa.Column('preferred_appointment_timing', sa.String(255), nullable=True),
    sa.Column('barriers', JSONB(), nullable=True),
    sa.Column('barriers_other', sa.String(255), nullable=True),
    sa.Column('interpreter_support', sa.String(20), nullable=True),
    sa.Column('adjustments_needed', sa.Text(), nullable=True),
]


def upgrade() -> None:
    for col in NEW_COLUMNS:
        op.add_column('referrals', col)
    op.create_index('ix_referrals_reference_number', 'referrals', ['reference_number'], unique=True)
    # The new form makes these optional.
    op.alter_column('referrals', 'mother_phone', existing_type=sa.String(50), nullable=True)
    op.alter_column('referrals', 'estimated_due_date', existing_type=sa.Date(), nullable=True)


def downgrade() -> None:
    op.alter_column('referrals', 'estimated_due_date', existing_type=sa.Date(), nullable=False)
    op.alter_column('referrals', 'mother_phone', existing_type=sa.String(50), nullable=False)
    op.drop_index('ix_referrals_reference_number', table_name='referrals')
    for col in reversed(NEW_COLUMNS):
        op.drop_column('referrals', col.name)
