from app.extensions import db
from datetime import datetime

class PasswordResetOTP(db.Model):
    __tablename__ = "password_reset_token"

    id = db.Column(db.Integer, primary_key=True)

    user_id = db.Column(db.Integer, db.ForeignKey("users.id"))

    email = db.Column(db.String, nullable=False)

    token_hash = db.Column(db.String, nullable=False)

    expires_at = db.Column(db.DateTime, nullable=False)

    used = db.Column(db.Boolean, default=False)
    
    created_at = db.Column(db.DateTime, default=datetime.utcnow)