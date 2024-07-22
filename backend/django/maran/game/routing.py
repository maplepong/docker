# chat/routing.py
from django.urls import re_path

from . import consumers

websocket_urlpatterns = [
    re_path(r"game/(?P<room_num>\w+)/$", consumers.GameConsumer.as_asgi()),
]