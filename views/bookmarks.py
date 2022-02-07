from flask import Response, request
from flask_restful import Resource
from models import Bookmark, db
import json

from my_decorators import handle_db_insert_error, id_is_integer_or_400_error
from . import can_view_post

class BookmarksListEndpoint(Resource):

    def __init__(self, current_user):
        self.current_user = current_user
    
    def get(self):
        bookmarks = Bookmark.query.filter_by(user_id=self.current_user.id).all()

        data = [
            item.to_dict() for item in bookmarks
        ]

        return Response(json.dumps(data), mimetype="application/json", status=200)

    @handle_db_insert_error
    def post(self):
        body = request.get_json()
        post_id = body.get('post_id')

        if not post_id:
            return Response(json.dumps({'message': 'Missing post_id'}), mimetype="application/json", status=400)

        if not can_view_post(post_id, self.current_user):
            return Response(json.dumps({'message': 'You are not authorized to view this post'}), mimetype="application/json", status=404)

        bookmark = Bookmark(self.current_user.id, post_id)

        db.session.add(bookmark)
        db.session.commit()

        return Response(json.dumps(bookmark.to_dict()), mimetype="application/json", status=201)

class BookmarkDetailEndpoint(Resource):

    def __init__(self, current_user):
        self.current_user = current_user
    
    @id_is_integer_or_400_error
    def delete(self, id):
        # a user can only delete their own bookmark:
        bookmark = Bookmark.query.get(id)
        if not bookmark or bookmark.user_id != self.current_user.id:
            return Response(json.dumps({'message': 'Bookmark does not exist'}), mimetype="application/json", status=404)
       

        Bookmark.query.filter_by(id=id).delete()
        db.session.commit()
        serialized_data = {
            'message': 'Bookmark {0} successfully deleted.'.format(id)
        }
        return Response(json.dumps(serialized_data), mimetype="application/json", status=200)



def initialize_routes(api):
    api.add_resource(
        BookmarksListEndpoint, 
        '/api/bookmarks', 
        '/api/bookmarks/', 
        resource_class_kwargs={'current_user': api.app.current_user}
    )

    api.add_resource(
        BookmarkDetailEndpoint, 
        '/api/bookmarks/<id>', 
        '/api/bookmarks/<id>',
        resource_class_kwargs={'current_user': api.app.current_user}
    )
