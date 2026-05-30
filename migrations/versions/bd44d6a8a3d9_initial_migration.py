"""Initial migration

Revision ID: bd44d6a8a3d9
Revises: 
Create Date: 2026-05-30 15:10:44.842735

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = 'bd44d6a8a3d9'
down_revision = None
branch_labels = None
depends_on = None


def upgrade():
    # Get database connection and inspect existing tables
    bind = op.get_bind()
    inspector = sa.inspect(bind)
    existing_tables = inspector.get_table_names()

    # 1. Create feedbacks table if it doesn't exist
    if 'feedbacks' not in existing_tables:
        op.create_table('feedbacks',
            sa.Column('id', sa.Integer(), nullable=False),
            sa.Column('name', sa.String(length=100), nullable=True),
            sa.Column('email', sa.String(length=120), nullable=True),
            sa.Column('message', sa.Text(), nullable=False),
            sa.Column('created_at', sa.DateTime(), nullable=True),
            sa.PrimaryKeyConstraint('id')
        )

    # 2. Create users table if it doesn't exist, or add missing columns
    if 'users' not in existing_tables:
        op.create_table('users',
            sa.Column('id', sa.Integer(), nullable=False),
            sa.Column('name', sa.String(length=100), nullable=False),
            sa.Column('email', sa.String(), nullable=False),
            sa.Column('role', sa.String(), nullable=True),
            sa.Column('password_hash', sa.Text(), nullable=True),
            sa.Column('auth_provider', sa.String(), nullable=True),
            sa.Column('google_id', sa.String(), nullable=True),
            sa.Column('failed_attempts', sa.Integer(), nullable=True),
            sa.Column('locked_until', sa.DateTime(), nullable=True),
            sa.Column('is_verified', sa.Boolean(), nullable=True),
            sa.PrimaryKeyConstraint('id'),
            sa.UniqueConstraint('email'),
            sa.UniqueConstraint('google_id')
        )
    else:
        # If users table already exists, only add missing columns
        columns = [c['name'] for c in inspector.get_columns('users')]
        
        if 'google_id' not in columns:
            op.add_column('users', sa.Column('google_id', sa.String(), nullable=True))
            # Also add the unique constraint since it's a new column
            op.create_unique_constraint('uq_users_google_id', 'users', ['google_id'])
            
        if 'failed_attempts' not in columns:
            op.add_column('users', sa.Column('failed_attempts', sa.Integer(), nullable=True))
            
        if 'locked_until' not in columns:
            op.add_column('users', sa.Column('locked_until', sa.DateTime(), nullable=True))
            
        if 'is_verified' not in columns:
            op.add_column('users', sa.Column('is_verified', sa.Boolean(), nullable=True))

    # 3. Create email_verification_token table if it doesn't exist
    if 'email_verification_token' not in existing_tables:
        op.create_table('email_verification_token',
            sa.Column('id', sa.Integer(), nullable=False),
            sa.Column('user_id', sa.Integer(), nullable=True),
            sa.Column('email', sa.String(), nullable=False),
            sa.Column('token_hash', sa.String(), nullable=False),
            sa.Column('expires_at', sa.DateTime(), nullable=False),
            sa.Column('used', sa.Boolean(), nullable=True),
            sa.Column('created_at', sa.DateTime(), nullable=True),
            sa.ForeignKeyConstraint(['user_id'], ['users.id'], ),
            sa.PrimaryKeyConstraint('id')
        )

    # 4. Create password_reset_token table if it doesn't exist
    if 'password_reset_token' not in existing_tables:
        op.create_table('password_reset_token',
            sa.Column('id', sa.Integer(), nullable=False),
            sa.Column('user_id', sa.Integer(), nullable=True),
            sa.Column('email', sa.String(), nullable=False),
            sa.Column('token_hash', sa.String(), nullable=False),
            sa.Column('expires_at', sa.DateTime(), nullable=False),
            sa.Column('used', sa.Boolean(), nullable=True),
            sa.Column('created_at', sa.DateTime(), nullable=True),
            sa.ForeignKeyConstraint(['user_id'], ['users.id'], ),
            sa.PrimaryKeyConstraint('id')
        )

    # 5. Create posts table if it doesn't exist
    if 'posts' not in existing_tables:
        op.create_table('posts',
            sa.Column('id', sa.Integer(), nullable=False),
            sa.Column('title', sa.String(length=100), nullable=False),
            sa.Column('content', sa.Text(), nullable=False),
            sa.Column('user_id', sa.Integer(), nullable=False),
            sa.ForeignKeyConstraint(['user_id'], ['users.id'], ),
            sa.PrimaryKeyConstraint('id')
        )

    # 6. Create refresh_tokens table if it doesn't exist
    if 'refresh_tokens' not in existing_tables:
        op.create_table('refresh_tokens',
            sa.Column('id', sa.Integer(), nullable=False),
            sa.Column('user_id', sa.Integer(), nullable=False),
            sa.Column('token_hash', sa.String(), nullable=True),
            sa.Column('expires_at', sa.DateTime(), nullable=False),
            sa.Column('revoked', sa.Boolean(), nullable=True),
            sa.Column('created_at', sa.DateTime(), nullable=True),
            sa.ForeignKeyConstraint(['user_id'], ['users.id'], ),
            sa.PrimaryKeyConstraint('id'),
            sa.UniqueConstraint('token_hash')
        )


def downgrade():
    bind = op.get_bind()
    inspector = sa.inspect(bind)
    existing_tables = inspector.get_table_names()

    if 'refresh_tokens' in existing_tables:
        op.drop_table('refresh_tokens')
    if 'posts' in existing_tables:
        op.drop_table('posts')
    if 'password_reset_token' in existing_tables:
        op.drop_table('password_reset_token')
    if 'email_verification_token' in existing_tables:
        op.drop_table('email_verification_token')
    if 'users' in existing_tables:
        op.drop_table('users')
    if 'feedbacks' in existing_tables:
        op.drop_table('feedbacks')
    # ### end Alembic commands ###
