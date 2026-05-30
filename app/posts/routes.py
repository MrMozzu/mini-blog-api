from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from app.auth.utils import  permission_required

from app.extensions import db, jwt
from app.posts.models import Post
from app.posts.schemas import post_schema, posts_schema
from app.users.models import User


post_bp = Blueprint("posts", __name__)

@post_bp.get("/posts")
def get_all_posts():
    posts = Post.query.all()
    return jsonify(posts_schema.dump(posts)), 200
@post_bp.get("/posts/<int:post_id>")
def get_single_post(post_id):
    post = Post.query.get_or_404(post_id)
    return jsonify(post_schema.dump(post)), 200

@post_bp.post("/posts")
@permission_required("create_post")  # verifies that the endpoint cannot be acces without a token and is valid token compares with the token that is sent to the client at the time of login 
def create_post():

    current_user_id = int(get_jwt_identity())  # extracts the identity like id or username from the token

    data = request.get_json() or {}

    post = post_schema.load(data)

    post.user_id = current_user_id # links the post to the authenticated user

    db.session.add(post)
    db.session.commit()

    return jsonify(post_schema.dump(post)), 201




@post_bp.get("/users/<int:user_id>/posts")
def get_post(user_id):

    user = User.query.get_or_404(user_id)

    return jsonify(posts_schema.dump(user.post)), 200


@post_bp.put("/posts/<int:post_id>")
@permission_required("edit_own_post")
def update_post(post_id):

    current_user_id = int(get_jwt_identity())

    post = Post.query.get_or_404(post_id)

    if post.user_id != current_user_id:
         return jsonify({"error": "You cannot edit this post"}), 403 # 403 - logged in but now allowed

    data = request.get_json() or {}

    post.title = data.get("title", post.title)
    post.content = data.get("content", post.content)

    db.session.commit()

    return jsonify(post_schema.dump(post)), 200 


# first check - Is this post owned by the logged-in user?

@post_bp.delete("/posts/<int:post_id>")
@permission_required("delete_own_post", "delete_any_post")
def delete_post(post_id):

    current_user_id  = int(get_jwt_identity())
    current_user = User.query.get(current_user_id)

    post = Post.query.get_or_404(post_id)

    from app.auth.permissions import ROLE_PERMISSIONS
    current_permissions = ROLE_PERMISSIONS.get(current_user.role, [])

    if "delete_any_post" not in current_permissions and post.user_id != current_user_id:
         return jsonify({"error": "You cannot delete this post"}), 403 # 403 - logged in but not allowed

    db.session.delete(post)
    db.session.commit()

    return jsonify({
        "message": "Data deleted successfully"
    }), 200

