from app.extensions import ma 
from app.posts.models import Post

class PostSchema(ma.SQLAlchemySchema):

    class Meta:
        model = Post
        load_instance = True 

    
    id = ma.auto_field(dump_only=True)
    title = ma.auto_field()
    content = ma.auto_field()
    user_id = ma.auto_field(dump_only=True)


post_schema = PostSchema()
posts_schema = PostSchema(many=True)

