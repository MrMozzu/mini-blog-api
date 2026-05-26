from app.auth.utils import hash_password, verify_password
from app.users.models import User
from app.extensions import db
from flask_jwt_extended import create_access_token, create_refresh_token
from werkzeug.security  import check_password_hash


def register_user(email, password):
    if not email or not password:
        return {"error": "Email and password are required"}, 400

    existing_user = User.query.filter_by(email=email).first() # checks if email already exists

    if existing_user:     # if exists then give this message
        return {"error": "Email already exists"}, 409

    
    hashed_password = hash_password(password) # if new user then hash its password

    username = email.split('@')[0] if email else "User"
    admin_emails = ["muzammilahsan07@gmail.com"]
    role = "admin" if email in admin_emails else "user"
    user = User(name=username, email=email, password_hash=hashed_password, role=role)  # collect it in an object 

    db.session.add(user) # added to the session
    db.session.commit()  # committed
 
    return {"message": "User created"}, 201


from datetime import datetime, timedelta

def login(email, password):
    if not email or not password:
        return {"error": "Email and password are required"}, 400

    user = User.query.filter_by(email=email).first()

    if not user:
        return {"error": "email is not registered"}, 401

    if user.locked_until and user.locked_until > datetime.utcnow():
        return {"error": "Account locked"}, 403
    
    if not verify_password(password, user.password_hash): # checks the current hashed password with the hash stored in db

        user.failed_attempts += 1
    
        if user.failed_attempts >= 5:
            user.locked_until = datetime.utcnow() + timedelta(minutes=15)
        db.session.commit()

        return {"error": "Invalid password"}, 401

    user.failed_attempts = 0
    user.locked_until = None
    db.session.commit()


    access_token = create_access_token(identity=str(user.id), additional_claims={"role": user.role})  # used to authenticate the user
    refresh_token = create_refresh_token(identity=str(user.id))  # used to get new access token when it is expiered

    
    return {"message": "Login Succsessful",
            "access_token": access_token,
            "refresh_token": refresh_token,
            "user": {
                "id": user.id,
                "email": user.email,
                "name": user.name,
                "role": user.role,
            },
    }, 200

    

import requests
from flask import current_app


GOOGLE_AUTH_URL = "https://accounts.google.com/o/oauth2/v2/auth"  # (backend redirects the user here).
GOOGLE_TOKEN_URL = "https://oauth2.googleapis.com/token"  # backend sends the code and exchange tokens here.
GOOGLE_USERINFO_URL = "https://www.googleapis.com/oauth2/v2/userinfo"  # google api endpoint from user profile data.


def build_google_login_url(state):  # this funtion builds the Google Login URL.
    return (
        f"{GOOGLE_AUTH_URL}"
        f"?client_id={current_app.config['GOOGLE_CLIENT_ID']}"
        f"&redirect_uri={current_app.config['GOOGLE_REDIRECT_URI']}" # after login Google sends user back here.
        f"&response_type=code"  # tells Google, send authorizaion code not tokens.
        f"&scope=openid email profile" # asks for requests permissions.
        f"&state={state}"
    )


def exchange_code_for_tokens(code):  
    response = requests.post(  # send post request to google 
        GOOGLE_TOKEN_URL,
        data={
            "code": code,
            "client_id": current_app.config["GOOGLE_CLIENT_ID"],
            "client_secret": current_app.config["GOOGLE_CLIENT_SECRET"],
            "redirect_uri": current_app.config["GOOGLE_REDIRECT_URI"],
            "grant_type": "authorization_code",
        },
        timeout=10,
    )
    response.raise_for_status()
    return response.json()


def fetch_google_user(access_token):
    response = requests.get(
        GOOGLE_USERINFO_URL,
        headers={"Authorization": f"Bearer {access_token}"},
        timeout=10,
    )
    response.raise_for_status()
    return response.json()

import secrets

def generate_oauth_state():
    return secrets.token_urlsafe(32)

    

from google.oauth2 import id_token
from google.auth.transport import requests as google_requests

def verify_google_id(token):

    idinfo = id_token.verify_oauth2_token(
        token,
        google_requests.Request(),
        current_app.config["GOOGLE_CLIENT_ID"]

    )

    if idinfo["iss"] not in [
        "accounts.google.com",
        "https://accounts.google.com"
    ]:

        raise Exception("Invalid issuer")

    if not idinfo.get("email_verified"):
        raise Exception("Email not verified")

    
    return idinfo


from app.auth.models import PasswordResetOTP
from app.auth.utils import (
    generate_reset_token,
    hash_token
)

from werkzeug.security import generate_password_hash

def forgot_password_service(data):

    email = data.get("email")
    user = User.query.filter_by(email=email).first()

    # always return the same response

    if not user:
        return {
        "message": "if account exists, reset email sent"}, 200

    # generate raw token
    raw_token = generate_reset_token()

    #Hash token
    hashed_token = hash_token(raw_token)

    #expiration time
    expires_at = datetime.utcnow() + timedelta(minutes=15)

    # stored hash token
    reset_record = PasswordResetOTP(
        user_id=user.id,
        token_hash=hashed_token,
        expires_at=expires_at
    )

    db.session.add(reset_record)
    db.session.commit()
    
    # send raw token by email 
    reset_link = (
        f"http://localhost:3000/reset-password"
        f"?token={raw_token}"
    )
    print("RESET LINK:", reset_link)

    return {
        "message": "if account exists, reset email sent"
        }, 200

def reset_password_service(data):
    
    raw_token = data.get("token")
    new_password = data.get("new_password")

    if not raw_token or not new_password:
        return {
            "error": "Missing fields"
        }, 400

    hashed_token = hash_token(raw_token)

    reset_record = PasswordResetOTP.query.filter_by(
        token_hash=hashed_token,
        used=False
    ).first()

    if not reset_record:
        return {
            "error": "Invalid token"
        }, 400

    # check if expiration
    if reset_record.expires_at < datetime.utcnow():
        return {
            "error": "Token expired"
        }, 400

    user = User.query.get(reset_record.user_id)

    if not user:
        return {
            "error": "User not found"
        }, 404

    # update password
    user.password_hash = generate_password_hash(new_password)

    # Mark token used
    reset_record.used = True

    db.session.commit()

    return {
        "message": "Password reset successful"
    }, 200