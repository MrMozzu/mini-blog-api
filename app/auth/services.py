from app.auth.utils import hash_password
from app.users.models import User
from app.extensions import db

def register_user(email, password):

    existing_user = User.query.filter_by(email=email).first() # checks if email already exists

    if existing_user:     # if exists then give this message
        return {"error": "Email already exists"}, 409

    
    hashed_password = hash_password(password) # if new user then hash its password

    user = User(email=email, password_hash=hashed_password)  # collect it in an object 

    db.session.add(user) # added to the session
    db.session.commit()  # committed
 
    return {"message": "User created"}, 201



