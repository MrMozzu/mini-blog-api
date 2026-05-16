import os 

class Config:
    SQLALCHEMY_DATABASE_URI = os.environ.get(
        "sqlite:///blog.db", "DATABASE_URL"
        )
    SQLALCHEMY_TRACK_MODIFICATIONS = False

    