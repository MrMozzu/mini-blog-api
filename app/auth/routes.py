from flask import Blueprint, request
from app.auth.services import register_user, login as login_service
from app.extensions import limiter


auth_bp = Blueprint("auth", __name__, url_prefix="/auth")

@auth_bp.post("/register")
def register():

    data = request.get_json() or {}

    email = data.get("email")
    password = data.get("password")

    return register_user(email, password)

# this function gets the data from json and converts it to data, then sends it to register_user()

def email_key():

    data = request.get_json(silent=True) or {} #silent=True prevents the crash if json in invalid
    email = data.get("email", "").lower().strip()

    ip = request.remote_add # gets clients IP

    return f"{ip}:{email}" # build a unique key 


@auth_bp.post("/login")
@limiter.limit("5 per minute", key_func=email_key) # limiter now tracks IP + email 
def login_route():

    data = request.get_json() or {}

    email = data.get("email")
    password = data.get("password")

    return login_service(email, password)




import secrets
from flask import redirect, request, jsonify, session, abort, current_app
from flask_jwt_extended import create_access_token, get_jwt_identity, jwt_required

from app.extensions import db
from app.auth.services import (
    build_google_login_url,
    exchange_code_for_tokens,
    fetch_google_user,
    generate_oauth_state,
    verify_google_id
)
from app.users.models import User


@auth_bp.get("/me")
@jwt_required()
def me():
    user = User.query.get_or_404(get_jwt_identity())

    return jsonify({
        "id": user.id,
        "email": user.email,
        "name": user.name,
        "role": user.role,
    }), 200


@auth_bp.get("/google/login")
def google_login():

    state = generate_oauth_state()  # generate state

    session["oauth_state"] = state # save state 

    google_url = (
        "https://accounts.google.com/o/oauth2/v2/auth"
        f"?client_id={GOOGLE_CLIENT_ID}"
        f"&redirect_uri={REDIRECT_URI}"
        f"&response_type=code"
        f"&scope=openid email profile"
        f"&state={state}"
    )
    
    redirect(build_google_login_url())


@auth_bp.get("/google/callback")
def google_callback():
  # validate state
    returned_state = request.args.get("state")

    saved_state = session.get("oauth_state")

    if not saved_state:
        abort(403)
    
    if returned_state != saved_state:
        abort(403)

    session.pop("oauth_state", None)

    code = request.args.get("code")

    if not code:
        return jsonify({"error": "Authorization code missing"}), 400

    tokens = exchange_code_for_tokens(code)
    google_id_token = tokens.get("id_token")
    

    if not google_access_token:
        return jsonify({"error": "Google access token missing"}), 400

    idinfo = verify_google_id(google_id_token)
    if not idinfo.get("email_verified"):
        abort(403)

    google_id = idinfo["sub"]
    email = idinfo["email"]
    name = idinfo["name"]

    if not google_id or not email:
        return jsonify({"error": "Google user data incomplete"}), 400

    user = User.query.filter_by(google_id=google_id).first()

    if not user:
        user = User.query.filter_by(email=email).first()

        if user:
            user.google_id = google_id
            user.auth_provider = "google"
        else:
            admin_emails = ["muzammilahsan07@gmail.com"]
            role = "admin" if email in admin_emails else "user"
            
            user = User(
                name=name,
                email=email,
                google_id=google_id,
                auth_provider="google",
                role=role,
            )
            db.session.add(user)

        db.session.commit()

    mini_blog_token = create_access_token(identity=str(user.id), additional_claims={"role": user.role})

    return jsonify({
        "message": "Google login successful",
        "access_token": mini_blog_token,
        "user": {
            "id": user.id,
            "email": user.email,
            "name": user.name,
            "role": user.role,
        }
    }), 200
