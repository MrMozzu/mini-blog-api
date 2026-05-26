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
        # Add columns safely
        batch_op.add_column(sa.Column('auth_provider', sa.String(), server_default='local', nullable=True))
        batch_op.add_column(sa.Column('google_id', sa.String(), nullable=True))
        batch_op.add_column(sa.Column('failed_attempts', sa.Integer(), server_default='0', nullable=True))
        batch_op.add_column(sa.Column('locked_until', sa.DateTime(), nullable=True))
        # SQLite compatibility for unique constraints requires naming conventions, but we can try generic
        try:
            batch_op.create_unique_constraint('uq_users_google_id', ['google_id'])
        except Exception:
            pass

def downgrade():
    with op.batch_alter_table('users', schema=None) as batch_op:
        try:
            batch_op.drop_constraint('uq_users_google_id', type_='unique')
        except Exception:
            pass
        batch_op.drop_column('locked_until')
        batch_op.drop_column('failed_attempts')
        batch_op.drop_column('google_id')
        batch_op.drop_column('auth_provider')
