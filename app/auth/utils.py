import bcrypt 
from flask import current_app

def hash_password(password: str) -> str:  # This  function hashed the password 

    pepper = current_app.config["PASSWORD_PEPPER"]

    password_with_pepper = pepper + password

    password_bytes = password_with_pepper.encode("utf-8")  # convert the raw pass into bytes 

    salt = bcrypt.gensalt()  # generates random salt (extra strong security)

    hashed = bcrypt.hashpw(password_bytes, salt) # hash the password and add salt to it 

    return hashed.decode("utf-8")  # return the password after decoding to string


def verify_password(password: str, hashed_password: str) -> bool: # this function verify hashed password  ans password are same after converting them to bytes

    pepper = current_app.config["PASSWORD_PEPPER"]

    password_with_pepper = pepper + password

    password_bytes = password_with_pepper.encode("utf-8")

    hashed_bytes = hashed_password.encode("utf-8")

    return bcrypt.checkpw(password_bytes, hashed_bytes)





