import bcrypt 
from flask import current_app

def hash_password(password: str) -> str:  # This  function hashed the password 

    pepper = current_app.config["PASSWORD_PEPPER"]

    password_with_pepper = pepper + password

    password_bytes = password_with_pepper.encode("utf-8")  # convert the raw pass into bytes 

    salt = bcrypt.gensalt()  # generates random salt (extra strong security)

    hashed = bcrypt.hashpw(password_bytes, salt) # hash the password and add salt to it 

    return hashed.decode("utf-8")  # return the password after decoding to string


def verify_password(password: str, hashed_password: str) -> bool: # this function verify hashed password  ans password are same after converting them to bytes

    pepper = current_app.config["PASSWORD_PEPPER"]

    password_with_pepper = pepper + password

    password_bytes = password_with_pepper.encode("utf-8")

    hashed_bytes = hashed_password.encode("utf-8")

    try:
        return bcrypt.checkpw(password_bytes, hashed_bytes)
    except ValueError:
        return False


from functools import wraps
from flask import jsonify

from flask_jwt_extended import get_jwt_identity, verify_jwt_in_request

from app.users.models import User
from app.auth.permissions import ROLE_PERMISSIONS


def permission_required(*required_permission):

    def wrapper(fn):

        @wraps(fn)
        def decorator(*args, **kwargs):

            try:
                verify_jwt_in_request()
            except Exception as e:
                return jsonify({"error": "Missing or invalid token"}), 401

            current_user_id = get_jwt_identity()
            current_user = User.query.get(current_user_id)

            if not current_user:
                return jsonify({"error": "User not found"}), 404

            
            user_permissions = ROLE_PERMISSIONS.get(current_user.role, [])

            if not any(p in user_permissions for p in required_permission):
                return jsonify({"error": "Not Authenticated"}), 403

            return fn(*args, **kwargs)

        return decorator

    return wrapper 


import secrets
import hashlib

def generate_reset_token():
    # Returns a 6-digit OTP
    return "".join(secrets.choice("0123456789") for _ in range(6))

def hash_token(token):
    return hashlib.sha256(token.encode()).hexdigest()

import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart

def send_otp_email(to_email, otp):
    smtp_server = current_app.config.get("SMTP_SERVER")
    smtp_port = current_app.config.get("SMTP_PORT")
    smtp_username = current_app.config.get("SMTP_USERNAME")
    smtp_password = current_app.config.get("SMTP_PASSWORD")
    sender_email = current_app.config.get("SENDER_EMAIL")

    if not smtp_username or not smtp_password:
        print(f"SMTP not configured. Would have sent OTP {otp} to {to_email}")
        return

    msg = MIMEMultipart()
    msg['From'] = sender_email
    msg['To'] = to_email
    msg['Subject'] = "Your Password Reset OTP"

    body = f"Your password reset OTP is: {otp}\nIt is valid for 15 minutes."
    msg.attach(MIMEText(body, 'plain'))

    try:
        server = smtplib.SMTP(smtp_server, smtp_port)
        server.starttls()
        server.login(smtp_username, smtp_password)
        server.send_message(msg)
        server.quit()
        print(f"OTP successfully sent to {to_email}")
    except Exception as e:
        print(f"Failed to send email: {e}")
