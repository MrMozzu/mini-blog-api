"""add missing columns

Revision ID: 28cc0a22c8d5
Revises: 6ce9652fcd26
Create Date: 2026-05-26 17:46:37.613182

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = '28cc0a22c8d5'
down_revision = '6ce9652fcd26'
branch_labels = None
depends_on = None


def upgrade():
    with op.batch_alter_table('users', schema=None) as batch_op:
        # Add columns safely. Using IF NOT EXISTS is not standard in SQLAlchemy so we rely on this script only adding what is truly missing.
        # auth_provider and google_id already exist in Render's DB from the lost migration.
        batch_op.add_column(sa.Column('failed_attempts', sa.Integer(), server_default='0', nullable=True))
        batch_op.add_column(sa.Column('locked_until', sa.DateTime(), nullable=True))

def downgrade():
    with op.batch_alter_table('users', schema=None) as batch_op:
        batch_op.drop_column('locked_until')
        batch_op.drop_column('failed_attempts')
