from flask import Flask
from flask_cors import CORS
from dotenv import load_dotenv
from app.extensions import db, migrate, ma, jwt, limiter

def create_app():
    load_dotenv()

    app = Flask(__name__)
    CORS(
    app,
    resources={
        r"/api/*": {
            "origins": [
                "http://localhost:3000"
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

    with app.app_context():
        db.create_all()


    from app.users.routes import users_bp
    from app.posts.routes import post_bp
    from app.auth.routes import auth_bp
   
    


    app.register_blueprint(users_bp)
    app.register_blueprint(post_bp)
    app.register_blueprint(auth_bp)
 
    return app 

    



