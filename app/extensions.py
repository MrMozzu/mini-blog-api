from flask_sqlalchemy import SQLAlchemy
from flask_migrate import Migrate
from flask_marshmallow import Marshmallow
from flask_jwt_extended import JWTManager



db = SQLAlchemy() # ORM layer
migrate = Migrate() # schema migrations system
ma = Marshmallow() # serialization + validation
jwt = JWTManager()






