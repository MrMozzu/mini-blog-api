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



class EmailVerificationOTP(db.Model):
    __tablename__ = "email_verification_token"

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey("users.id"))
    email = db.Column(db.String, nullable=False)
    token_hash = db.Column(db.String, nullable=False)
    expires_at = db.Column(db.DateTime, nullable=False)
    used = db.Column(db.Boolean, default=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)



class RefreshToken(db.Model):
    __tablename__ = "refresh_tokens"

    id = db.Column(db.Integer, primary_key=True,nullable=False)
    user_id = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=False)
    token_hash = db.Column(db.String, unique=True)
    expires_at = db.Column(db.DateTime, nullable=False)
    revoked = db.Column(db.Boolean, default=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    user = db.relationship("User", backref="refresh_tokens")

