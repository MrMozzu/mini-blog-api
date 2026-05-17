from flask import Blueprint, request, jsonify

from app.extensions import db
from app.users.models import User
from app.users.schemas import user_schema, users_schema


users_bp = Blueprint("users", __name__, url_prefix="/users")


@users_bp.post("/")
def create_user():

    data = request.get_json()

    user = user_schema.load(data)

    db.session.add(user)
    db.session.commit()

    return jsonify(user_schema.dump(user)), 201


@users_bp.get("/")
def get_users():

    users = User.query.all()

    return jsonify(users_schema.dump(users)), 200


@users_bp.get("/<int:user_id>")
def get_user(user_id):

    user = User.query.get_or_404(user_id)

    return jsonify(user_schema.dump(user)), 200

@users_bp.delete("/<int:user_id>")
def delete_user(user_id):
    user = User.query.get_or_404(user_id)
    db.session.delete(user)
    db.session.commit()
    return jsonify({"message": "User deleted successfully"}), 200
