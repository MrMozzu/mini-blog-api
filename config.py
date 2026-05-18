import os

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


    