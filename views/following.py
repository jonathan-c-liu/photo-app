from flask import Response, request
from flask_restful import Resource
from views import can_view_post
from my_decorators import handle_db_insert_error, handle_missing_or_invalid_user_id, id_is_integer_or_400_error
from models import Following, User, db
import json

def get_path():
    return request.host_url + 'api/posts/'

class FollowingListEndpoint(Resource):
    def __init__(self, current_user):
        self.current_user = current_user
    
    def get(self):
        followers = Following.query.filter_by(user_id=self.current_user.id).all()
        
        data = [
            item.to_dict_following() for item in followers
        ]

        return Response(json.dumps(data), mimetype="application/json", status=200)
    
    @handle_db_insert_error
    @handle_missing_or_invalid_user_id
    def post(self):
        body = request.get_json()
        user_id = body.get('user_id')

        following = Following(self.current_user.id, user_id)
        
        db.session.add(following)
        db.session.commit()

        return Response(json.dumps(following.to_dict_following()), mimetype="application/json", status=201)
        


class FollowingDetailEndpoint(Resource):
    def __init__(self, current_user):
        self.current_user = current_user

    @id_is_integer_or_400_error
    def delete(self, id):
        following = Following.query.get(id)
        if not following or following.user_id != self.current_user.id:
            return Response(json.dumps({'message': 'Following does not exist'}), mimetype="application/json", status=404)
       

        Following.query.filter_by(id=id).delete()
        db.session.commit()
        serialized_data = {
            'message': 'Following {0} successfully deleted.'.format(id)
        }
        return Response(json.dumps(serialized_data), mimetype="application/json", status=200)


def initialize_routes(api):
    api.add_resource(
        FollowingListEndpoint, 
        '/api/following', 
        '/api/following/', 
        resource_class_kwargs={'current_user': api.app.current_user}
    )
    api.add_resource(
        FollowingDetailEndpoint, 
        '/api/following/<id>', 
        '/api/following/<id>/', 
        resource_class_kwargs={'current_user': api.app.current_user}
    )
