from flask_sqlalchemy import SQLAlchemy
from flask_migrate import Migrate
from flask_marshmallow import Marshmallow
from flask_jwt_extended import JWTManager
from flask_limiter import Limiter
from flask_limiter.util import get_remote_address



db = SQLAlchemy() # ORM layer
migrate = Migrate() # schema migrations system
ma = Marshmallow() # serialization + validation
jwt = JWTManager()
limiter = Limiter(
    key_func=get_remote_address
       
)






