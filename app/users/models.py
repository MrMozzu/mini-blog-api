from app.extensions import db

class User(db.Model):
    __tablename__ = "users"

    id  = db.Column(db.Integer, primary_key=True)

    name = db.Column(db.String(100),nullable=False)

    email = db.Column(db.String, unique=True,nullable=False)

    password_hash = db.Column(db.Text)

    post = db.relationship(
        "Post",
        backref="user",
        lazy=True,
        cascade="all, delete-orphan"
    )

