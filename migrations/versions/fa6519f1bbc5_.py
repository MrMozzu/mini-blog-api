"""added oauth column to db

Revision ID: fa6519f1bbc5
Revises: 
Create Date: 2026-05-22 08:31:23.185009

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = 'fa6519f1bbc5'
down_revision = None
branch_labels = None
depends_on = None


def upgrade():
    with op.batch_alter_table("users") as batch_op:
        batch_op.add_column(sa.Column("google_id", sa.String(length=255), nullable=True))
        batch_op.add_column(sa.Column("auth_provider", sa.String(length=50), nullable=True))
        batch_op.create_unique_constraint("uq_users_google_id", ["google_id"])


def downgrade():
    with op.batch_alter_table("users") as batch_op:
        batch_op.drop_constraint("uq_users_google_id", type_="unique")
        batch_op.drop_column("auth_provider")
        batch_op.drop_column("google_id")