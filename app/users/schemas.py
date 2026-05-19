from app.extensions import ma
from app.users.models import User

class UserSchema(ma.SQLAlchemySchema):

    class Meta:
        model = User
        load_instance = True

    
    id = ma.auto_field(dump_only=True)
    name = ma.auto_field()
    email = ma.auto_field()
    role = ma.auto_field()
    password_hash = ma.auto_field()


user_schema = UserSchema()
users_schema = UserSchema(many=True)

