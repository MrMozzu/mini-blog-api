from flask import Blueprint, request, jsonify

from app.extensions import db
from app.posts.models import Post
from app.posts.schemas import post_schema, posts_schema
from app.users.models import User


post_bp = Blueprint("posts", __name__)

@post_bp.post("/users/<int:user_id>/posts")
def create_post(user_id):

    user = User.query.get_or_404(user_id)

    data = request.get_json()

    post = post_schema.load(data)

    post.user = user

    db.session.add(post)
    db.session.commit()

    return jsonify(post_schema.dump(post)), 201


@post_bp.get("/users/<int:user_id>/posts")
def get_post(user_id):

    user = User.query.get_or_404(user_id)

    return jsonify(posts_schema.dump(user.post)), 200


@post_bp.put("/posts/<int:post_id>")
def update_post(post_id):

    post = Post.query.get_or_404(post_id)

    data = request.get_json()

    post.title = data.get("title", post.title)
    post.content = data.get("content", post.content)

    db.session.commit()

    return jsonify(post_schema.dump(post)), 200 


@post_bp.delete("/posts/<int:post_id>")
def delete_post(post_id):

    post = Post.query.get_or_404(post_id)

    db.session.delete(post)
    db.session.commit()

    return jsonify({
        "message": "Data deleted succesfully"
    
    }), 200

