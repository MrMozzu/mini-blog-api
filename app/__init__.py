from flask import Flask, send_from_directory
from flask_cors import CORS
from dotenv import load_dotenv
from app.extensions import db, migrate, ma, jwt, limiter
import os

def create_app():
    load_dotenv()

    app = Flask(__name__)
    CORS(
    app,
    resources={
        r"/*": {
            "origins": [
                "http://localhost:3000",
                "http://127.0.0.1:5000"
            ]
        }
    },
    allow_headers=["Content-Type", "Authorization"],
    methods=["GET", "POST", "PUT", "DELETE"]
)
    # this allows read cookies, JWT, session authentication to the local host
   
    app.config.from_object("config.Config")

    db.init_app(app)
    migrate.init_app(app, db)
    ma.init_app(app)
    jwt.init_app(app)
    limiter.init_app(app)
   

    from app.users.models import User
    from app.posts.models import Post
    from app.feedback.models import Feedback

    from app.auth.models import RefreshToken, PasswordResetOTP, EmailVerificationOTP 



    from app.users.routes import users_bp
    from app.posts.routes import post_bp
    from app.auth.routes import auth_bp
    from app.feedback.routes import feedback_bp
   
    


    app.register_blueprint(users_bp)
    app.register_blueprint(post_bp)
    app.register_blueprint(auth_bp)
    app.register_blueprint(feedback_bp)

    # Serve frontend static files
    frontend_dir = os.path.join(os.path.dirname(os.path.dirname(__file__)), 'frontend')

    @app.route('/')
    def serve_frontend():
        return send_from_directory(frontend_dir, 'index.html')

    @app.route('/<path:filename>')
    def serve_static(filename):
        return send_from_directory(frontend_dir, filename)

    return app
