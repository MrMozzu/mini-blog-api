from app.auth.utils import hash_password, verify_password
from app.users.models import User
from app.extensions import db
from flask_jwt_extended import create_access_token, create_refresh_token


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



def login(email, password):
    if not email or not password:
        return {"error": "Email and password are required"}, 400

    user = User.query.filter_by(email=email).first()

    if not user:
        return {"error": "email is not registered"}, 401

    is_valid = verify_password(password, user.password_hash)

    if not is_valid:
        return {"error": "Invalid password"}, 401

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


def build_google_login_url():  # this funtion builds the Google Login URL.
    return (
        f"{GOOGLE_AUTH_URL}"
        f"?client_id={current_app.config['GOOGLE_CLIENT_ID']}"
        f"&redirect_uri={current_app.config['GOOGLE_REDIRECT_URI']}" # after login Google sends user back here.
        f"&response_type=code"  # tells Google, send authorizaion code not tokens.
        f"&scope=openid email profile" # asks for requests permissions.
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
from google.auth.transport import requests

def verify_google_id(token):

    idinfo = id_token.verify_oauth2_token(
        token,
        requests.Request(),
        GOOGLE_CLIENT_ID

    )

    if idinfo["iss"] not in [
        "accounts.google.com",
        "https://accounts.google.com"
    ]:

        raise Exception

    if not idinfo.get("email verified"):
        raise Exception("Email not verified")

    
    return idinfo
