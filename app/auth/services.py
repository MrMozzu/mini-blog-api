from app.auth.utils import hash_password, verify_password
from app.users.models import User
from app.extensions import db
from flask_jwt_extended import create_access_token, create_refresh_token


def register_user(email, password):

    existing_user = User.query.filter_by(email=email).first() # checks if email already exists

    if existing_user:     # if exists then give this message
        return {"error": "Email already exists"}, 409

    
    hashed_password = hash_password(password) # if new user then hash its password

    username = email.split('@')[0] if email else "User"
    role = "admin" if email == "muzammilahsan07@gmail.com" else "user"
    user = User(name=username, email=email, password_hash=hashed_password, role=role)  # collect it in an object 

    db.session.add(user) # added to the session
    db.session.commit()  # committed
 
    return {"message": "User created"}, 201



def login(email, password):

    user = User.query.filter_by(email=email).first()

    if not user:
        return {"error": "email is not registered"}, 401

    is_valid = verify_password(password, user.password_hash)

    if not is_valid:
        return {"error": "Invalid password"}, 401

    access_token = create_access_token(identity=str(user.id), additional_claims={"role": user.role})  # used to authenticate the user
    refresh_token = create_refresh_token(identity=str(user.id))  # used to get new access token when it is expiered

    
    return {"message": "Login Succsessful",
            "access_token": access_token,
            "refresh_token": refresh_token
    }, 200

    