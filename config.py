import os
from datetime import timedelta

class Config:
    database_url = os.environ.get("DATABASE_URL")
    
    if not database_url:
        database_url = "sqlite:///blog.db"
    
    database_url = database_url.strip()
    
    if database_url.startswith("postgres://"):
        database_url = database_url.replace("postgres://", "postgresql://", 1)
        
    SQLALCHEMY_DATABASE_URI = database_url
    SQLALCHEMY_TRACK_MODIFICATIONS = False

    PASSWORD_PEPPER = os.getenv("PASSWORD_PEPPER", "")

    SECRET_KEY = os.getenv("SECRET_KEY", "dev-change-me-mini-blog-secret-key-32")

    JWT_SECRET_KEY = os.getenv("JWT_SECRET_KEY", "dev-change-me-mini-blog-jwt-secret-key-32")

    JWT_ACCESS_TOKEN_EXPIRES  = timedelta(minutes=15)
    JWT_REFRESH_TOKEN_EXPIRES = timedelta(days=7)
    JWT_COOKIE_SECURE = True
    


    GOOGLE_CLIENT_ID = os.getenv("GOOGLE_CLIENT_ID")
    GOOGLE_CLIENT_SECRET = os.getenv("GOOGLE_CLIENT_SECRET")
    GOOGLE_REDIRECT_URI = os.getenv("GOOGLE_REDIRECT_URI")


    
