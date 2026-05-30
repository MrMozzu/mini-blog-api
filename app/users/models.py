from app.extensions import db


class User(db.Model):
    __tablename__ = "users"

    id  = db.Column(db.Integer, primary_key=True)

    name = db.Column(db.String(100),nullable=False)

    email = db.Column(db.String, unique=True,nullable=False)

    role = db.Column(db.String, default="user")

    password_hash = db.Column(db.Text, nullable=True)

    auth_provider = db.Column(db.String, default="local")

    google_id = db.Column(db.String, nullable=True, unique=True)

    failed_attempts = db.Column(db.Integer, default=0)

    locked_until = db.Column(db.DateTime, nullable=True)

    is_verified = db.Column(db.Boolean, default=False)

    post = db.relationship(
        "Post",
        backref="user",
        lazy=True,
        cascade="all, delete-orphan"
    )

