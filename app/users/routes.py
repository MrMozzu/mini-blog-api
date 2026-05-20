from app.auth.utils import permission_required
from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity

from app.auth.utils import admin_required
from app.extensions import db
from app.users.models import User
from app.users.schemas import user_schema, users_schema



users_bp = Blueprint("users", __name__, url_prefix="/users")


@users_bp.get("/")
def get_users():

    users = User.query.all()

    return jsonify(users_schema.dump(users)), 200


@users_bp.get("/<int:user_id>")
def get_user(user_id):

    user = User.query.get_or_404(user_id)

    return jsonify(user_schema.dump(user)), 200



@users_bp.delete("/<int:id>")
@permission_required("delete_own_user", "delete_any_user")
def delete_user(id):

    user = User.query.get_or_404(id)
    db.session.delete(user)
    db.session.commit()

    return jsonify({"message": "User deleted"}), 200

# because i created this permission route so we don't need the jwt and admin_required routes 
# they are previouly created by me but now i don't need them 
# becasue permission required already checks JWT authentication and admin role

# @users_bp.delete("/me")
# @jwt_required()
# def delete_my_account():
    
#     current_user_id = get_jwt_identity()

#     user = User.query.get(current_user_id)

#     if not user:
#         return jsonify({"error": "User not found"}), 404

#     db.session.delete(user)
#     db.session.commit()

#     return jsonify({"message": "User deleted successfully!"}), 200

# # for admins 

# @users_bp.delete("/<int:id>")
# @admin_required()
# def delete_user(id):

#     user = User.query.get_or_404(id)

#     db.session.delete(user)
#     db.session.commit()

#     return jsonify({"message": "User deleted successfully!"}), 200


