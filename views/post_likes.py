from flask import Response
from flask_restful import Resource
from models import LikePost, db
import json
import flask_jwt_extended

from my_decorators import handle_db_insert_error, id_is_integer_or_400_error, post_id_is_integer_or_400_error
from . import can_view_post

class PostLikesListEndpoint(Resource):

    def __init__(self, current_user):
        self.current_user = current_user
    
    @flask_jwt_extended.jwt_required()
    @handle_db_insert_error
    @post_id_is_integer_or_400_error
    def post(self, post_id):
        # if not post_id.isnumeric():
        #     return Response(json.dumps({'message': 'Post_id must be an integer'}), mimetype="application/json", status=400)

        if not can_view_post(post_id, self.current_user):
            return Response(json.dumps({'message': 'You are not authorized to view this post'}), mimetype="application/json", status=404)

        likePost = LikePost(self.current_user.id, post_id)
        
        db.session.add(likePost)
        db.session.commit()

        return Response(json.dumps(likePost.to_dict()), mimetype="application/json", status=201)

class PostLikesDetailEndpoint(Resource):

    def __init__(self, current_user):
        self.current_user = current_user

    @flask_jwt_extended.jwt_required()
    def delete(self, post_id, id):
        try:
            int(id)
        except:
            return Response(
                json.dumps({'message': '{0} must be an integer.'.format(id)}), 
                mimetype="application/json", 
                status=400
            )

        likePost = LikePost.query.get(id)
        if not likePost or likePost.user_id != self.current_user.id:
            return Response(json.dumps({'message': 'Like does not exist'}), mimetype="application/json", status=404)
       
        LikePost.query.filter_by(id=id).delete()
        db.session.commit()

        serialized_data = {
            'message': 'Like {0} successfully deleted.'.format(id)
        }

        return Response(json.dumps(serialized_data), mimetype="application/json", status=200)



def initialize_routes(api):
    api.add_resource(
        PostLikesListEndpoint, 
        '/api/posts/<post_id>/likes', 
        '/api/posts/<post_id>/likes/', 
        resource_class_kwargs={'current_user': flask_jwt_extended.current_user}
    )

    api.add_resource(
        PostLikesDetailEndpoint, 
        '/api/posts/<post_id>/likes/<id>', 
        '/api/posts/<post_id>/likes/<id>/',
        resource_class_kwargs={'current_user': flask_jwt_extended.current_user}
    )
