from flask import Flask
from app.extensions import db, migrate, ma

def create_app():

    app = Flask(__name__)

    app.config.from_object("config.Config")

    db.init_app(app)
    migrate.init_app(app, db)
    ma.init_app(app)

    with app.app_context():
        db.create_all()
    from app.users.models import User
    from app.posts.models import Post

    with app.app_context():
        db.create_all()

    from app.users.routes import users_bp
    from app.posts.routes import post_bp

    app.register_blueprint(users_bp)
    app.register_blueprint(post_bp)

    return app 

    



