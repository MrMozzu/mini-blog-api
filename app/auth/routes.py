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



