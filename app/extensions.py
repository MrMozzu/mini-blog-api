from flask_sqlalchemy import SQLAlchemy
from flask_migrate import Migrate
from flask_marshmallow import Marshmallow

db = SQLAlchemy() # ORM layer
migrate = Migrate() # schema migrations system
ma = Marshmallow() # serialization + validation




