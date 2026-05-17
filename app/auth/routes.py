from flask import Blueprint, request
from app.auth.services import register_user

auth_bp = Blueprint("auth", __name__)

@auth_bp.post("/register")
def register():

    data = request.get_json()

    email = data.get("email")
    password = data.get("password")

    return register_user(email, password)

# this function gets the data from json and converts it to data, then sends it to register_user()


@auth_bp.post("/login")
def login():

    data = request.get_json()

    email = data.get["email"]
    password = data.get["password"]

    return login(email, password)


    