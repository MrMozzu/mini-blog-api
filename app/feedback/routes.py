from flask import Blueprint, request, jsonify
from app.extensions import db
from app.feedback.models import Feedback

feedback_bp = Blueprint('feedback', __name__, url_prefix='/api/feedback')

@feedback_bp.post('/')
def submit_feedback():
    data = request.get_json()

    if not data or not data.get("message"):
        return jsonify({"error": "Message is required"}), 400

    name = data.get("name", "").strip()
    email = data.get("email", "").strip()
    message = data.get("message").strip()

    if not message:
        return jsonify({"error": "Message cannot be empty"}), 400

    new_feedback = Feedback(
        name=name if name else None,
        email=email if email else None,
        message=message
    )

    db.session.add(new_feedback)
    db.session.commit()

    return jsonify({"message": "Thank you for your feedback!"}), 201
