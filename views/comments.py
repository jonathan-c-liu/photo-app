from flask import Response, request
from flask_restful import Resource

from my_decorators import handle_db_insert_error, id_is_integer_or_400_error
from . import can_view_post
import json
from models import db, Comment
import flask_jwt_extended

class CommentListEndpoint(Resource):

    def __init__(self, current_user):
        self.current_user = current_user
    
    @flask_jwt_extended.jwt_required()
    @handle_db_insert_error
    def post(self):
        body = request.get_json()
        post_id = body.get('post_id')
        text = body.get('text')
        
        if not post_id or not text:
            return Response(json.dumps({'message': 'Missing post_id'}), mimetype="application/json", status=400)

        if not can_view_post(post_id, self.current_user):
            return Response(json.dumps({'message': 'You are not authorized to view this post'}), mimetype="application/json", status=404)

        comment = Comment(text, self.current_user.id, post_id)
        
        db.session.add(comment)
        db.session.commit()

        return Response(json.dumps(comment.to_dict()), mimetype="application/json", status=201)
        
class CommentDetailEndpoint(Resource):

    def __init__(self, current_user):
        self.current_user = current_user
  
    @flask_jwt_extended.jwt_required()
    @id_is_integer_or_400_error
    def delete(self, id):
        print(type(id))

        # a user can only delete their own comment:
        comment = Comment.query.get(id)
        if not comment or comment.user_id != self.current_user.id:
            return Response(json.dumps({'message': 'Comment does not exist'}), mimetype="application/json", status=404)
       

        Comment.query.filter_by(id=id).delete()
        db.session.commit()
        serialized_data = {
            'message': 'Comment {0} successfully deleted.'.format(id)
        }
        return Response(json.dumps(serialized_data), mimetype="application/json", status=200)


def initialize_routes(api):
    api.add_resource(
        CommentListEndpoint, 
        '/api/comments', 
        '/api/comments/',
        resource_class_kwargs={'current_user': flask_jwt_extended.current_user}

    )
    api.add_resource(
        CommentDetailEndpoint, 
        '/api/comments/<id>', 
        '/api/comments/<id>',
        resource_class_kwargs={'current_user': flask_jwt_extended.current_user}
    )
