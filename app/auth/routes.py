from flask import Blueprint, request
from app.auth.services import register_user, login as login_service

auth_bp = Blueprint("auth", __name__, url_prefix="/auth")

@auth_bp.post("/register")
def register():

    data = request.get_json()

    email = data.get("email")
    password = data.get("password")

    return register_user(email, password)

# this function gets the data from json and converts it to data, then sends it to register_user()


@auth_bp.post("/login")
def login_route():

    data = request.get_json()

    email = data.get("email")
    password = data.get("password")

    return login_service(email, password)





from flask import redirect, request, jsonify
from flask_jwt_extended import create_access_token

from app.extensions import db
from app.auth.services import (
    build_google_login_url,
    exchange_code_for_tokens,
    fetch_google_user,
)
from app.users.models import User


@auth_bp.get("/google/login")
def google_login():
    return redirect(build_google_login_url())


@auth_bp.get("/google/callback")
def google_callback():
    code = request.args.get("code")

    if not code:
        return jsonify({"error": "Authorization code missing"}), 400

    tokens = exchange_code_for_tokens(code)
    google_access_token = tokens.get("access_token")

    if not google_access_token:
        return jsonify({"error": "Google access token missing"}), 400

    google_user = fetch_google_user(google_access_token)

    google_id = google_user.get("id")
    email = google_user.get("email")
    name = google_user.get("name")

    if not google_id or not email:
        return jsonify({"error": "Google user data incomplete"}), 400

    user = User.query.filter_by(google_id=google_id).first()

    if not user:
        user = User.query.filter_by(email=email).first()

        if user:
            user.google_id = google_id
            user.auth_provider = "google"
        else:
            user = User(
                username=name,
                email=email,
                google_id=google_id,
                auth_provider="google",
                role="user",
            )
            db.session.add(user)

        db.session.commit()

    mini_blog_token = create_access_token(identity=str(user.id))

    return jsonify({
        "message": "Google login successful",
        "access_token": mini_blog_token,
        "user": {
            "id": user.id,
            "email": user.email,
            "username": user.username,
            "role": user.role,
        }
    }), 200