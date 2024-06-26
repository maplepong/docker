from channels.middleware import BaseMiddleware
from channels.db import database_sync_to_async
from django.contrib.auth.models import AnonymousUser
from rest_framework_simplejwt.tokens import AccessToken
from user.models import User
import json

@database_sync_to_async
def get_user(token_key):
    try:
        token = AccessToken(token_key)
        user_id = token['user_id']
        return User.objects.get(id=user_id)
    except Exception:
        return AnonymousUser()

class JWTAuthMiddleware(BaseMiddleware):
    async def __call__(self, scope, receive, send):
        headers = dict(scope['headers'])
        header_dict = {k.decode('utf-8'): v.decode('utf-8') for k, v in headers.items()}
        if 'sec-websocket-protocol' in header_dict.keys():
            token_key = header_dict['sec-websocket-protocol'].split(' ')[1]
        else:
            await send({
                'type': 'websocket.close',
                'code': 4001,  # Custom close code
                'reason': 'Authentication token is missing'
            })
            return
        scope['user'] = await get_user(token_key) if token_key else AnonymousUser()
        return await super().__call__(scope, receive, send)
    
    async def receive(self, scope, receive, send):
        message = await receive()
        if message['type'] == 'websocket.receive':
            data = json.loads(message['text'])
            if data.get('type') == 'authenticate':
                token_key = data.get('token')
                scope['user'] = await get_user(token_key)
                if scope['user'].is_anonymous:
                    await send({
                        'type': 'websocket.close',
                        'code': 4001
                    })
                    return
            elif 'message' in data:
                return await super().receive(scope, receive, send)
        return await super().receive(scope, receive, send)