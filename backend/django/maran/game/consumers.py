import json
from channels.generic.websocket import AsyncWebsocketConsumer
from asgiref.sync import sync_to_async
from .models import Game
from user.models import User
from user.image import get_image_url
from .views import remove_player

class GameConsumer(AsyncWebsocketConsumer):
    rooms = {}

    async def connect(self):
        self.room_num = self.scope["url_route"]["kwargs"]["room_num"]
        self.room_group_name = f"game_{self.room_num}"
        self.nickname = None

        await self.channel_layer.group_add(self.room_group_name, self.channel_name)
        await self.accept()

        if self.room_group_name not in self.rooms:
            self.rooms[self.room_group_name] = 0

        self.rooms[self.room_group_name] += 1
        print(f"connect! Room: {self.room_group_name}, Count: {self.rooms[self.room_group_name]}")
        print(f"channel name : ", self.channel_name)

    async def disconnect(self, close_code):
        print("disconnect!", close_code)

        if (close_code == 1001 and self.nickname is not None):
            game = await sync_to_async(Game.objects.get)(id=self.room_num)
            user = await sync_to_async(User.objects.get)(nickname=self.nickname)
            await sync_to_async(remove_player)(game, user)

        await self.channel_layer.group_discard(self.room_group_name, self.channel_name)
        self.rooms[self.room_group_name] -= 1

        if self.rooms[self.room_group_name] == 0:
            del self.rooms[self.room_group_name]
        else:
            print(f"client left! Room: {self.room_group_name}, Remaining Count: {self.rooms[self.room_group_name]}")
            await self.channel_layer.group_send(
                self.room_group_name,
                {
                    "type": "client_left"
                }
            )

    async def receive(self, text_data):
        text_data_json = json.loads(text_data)
        message_type = text_data_json.get("type")
        nickname = text_data_json.get("nickname")


        print(self)
        print(self.scope)
        print(self.scope["url_route"])
        print(self.scope["user"])

        if self.nickname is None:
            self.nickname = nickname

        print("type : ", message_type, " nickname :", nickname)

        if self.rooms[self.room_group_name] == 2 and message_type == "client_connected":
            print("2명이 모두 준비 완료")
            await self.channel_layer.group_send(
                self.room_group_name,
                {
                    "type": "game_ready",
                    "nickname": nickname
                }
            )
        else:
            if message_type == "game_start":
                await self.channel_layer.group_send(
                    self.room_group_name,
                    {
                        "type": "game_start"
                    }
                )
            if message_type == "game_update":
                data = text_data_json.get("data")
                await self.channel_layer.group_send(
                    self.room_group_name,
                    {
                        "type": "game_update",
                        "nickname": nickname,
                        "channel_name": self.channel_name,
                        "data": data
                    }
                )
            # elif message_type == "paddle_move":
            if message_type == "paddle_move":
                data = text_data_json.get("data")
                print("paddle move : ", data)
                await self.channel_layer.group_send(
                    self.room_group_name,
                    {
                        "type": "paddle_move",
                        "nickname": nickname,
                        "channel_name": self.channel_name,
                        "data": data
                    }
                )
            elif message_type == "client_left":
                print("client left!")
                await self.channel_layer.group_send(
                    self.room_group_name,
                    {
                        "type": "client_left"
                    }
                )
            else:
                print("type : ", message_type, " data :", text_data_json.get("data"))

    async def game_start(self, event):
        await self.send(text_data=json.dumps({"type": "game_start"}))

    async def game_update(self, event):
        data = event["data"]
        nickname = event["nickname"]
        channel_name = event["channel_name"]
        
        if channel_name == self.channel_name: return
        await self.send(text_data=json.dumps({"type": "game_update", "nickname": nickname, "data": data}))

    async def paddle_move(self, event):
        paddle_data = event["data"]
        print(paddle_data)
        nickname = event["nickname"]
        channel_name = event["channel_name"]
        if channel_name == self.channel_name: return
        await self.send(text_data=json.dumps({"type": "paddle_move", "nickname": nickname, "data": paddle_data}))

    async def game_ready(self, event):
        nickname = event.get("nickname")
        print("nickname : ", nickname)
        game = await sync_to_async(Game.objects.get)(id=self.room_num)
        player = await sync_to_async(User.objects.get)(nickname=nickname)
        player_info = {
            "nickname": player.nickname,
            "image": get_image_url(player.image),
            "win_rate": player.win_rate,
        }
        await self.send(text_data=json.dumps({"type": "game_ready", "nickname": nickname, "player_info": player_info}))

    async def client_left(self, event):
        await self.send(text_data=json.dumps({"type": "client_left"}))


# class GameConsumer(AsyncWebsocketConsumer):
#     rooms = {}

#     async def connect(self):
#         self.room_num = self.scope["url_route"]["kwargs"]["room_num"]
#         self.room_group_name = f"game_{self.room_num}"
#         self.nickname = None

#         await self.channel_layer.group_add(self.room_group_name, self.channel_name)
#         await self.accept()

#         if self.room_group_name not in self.rooms:
#             self.rooms[self.room_group_name] = 0

#         self.rooms[self.room_group_name] += 1
#         print(f"connect! Room: {self.room_group_name}, Count: {self.rooms[self.room_group_name]}")
#         print(f"channel name : ", self.channel_name)

#     async def disconnect(self, close_code):
#         print("disconnect!", close_code)

#         await self.channel_layer.group_discard(self.room_group_name, self.channel_name)
#         self.rooms[self.room_group_name] -= 1

#         if self.rooms[self.room_group_name] == 0:
#             del self.rooms[self.room_group_name]
#         else:
#             print(f"client left! Room: {self.room_group_name}, Remaining Count: {self.rooms[self.room_group_name]}")
#             await self.channel_layer.group_send(
#                 self.room_group_name,
#                 {
#                     "type": "client_left"
#                 }
#             )

#     async def receive(self, text_data):
#         text_data_json = json.loads(text_data)
#         message_type = text_data_json.get("type")
#         nickname = text_data_json.get("nickname")

#         if self.nickname is None:
#             self.nickname = nickname

#         print("type : ", message_type, " nickname :", nickname)

#         if self.rooms[self.room_group_name] == 2 and message_type == "client_connected":
#             print("2명이 모두 준비 완료")
#             await self.channel_layer.group_send(
#                 self.room_group_name,
#                 {
#                     "type": "game_ready",
#                     "nickname": nickname
#                 }
#             )
#         else:
#             if message_type == "game_update":
#                 user = text_data_json.get("user")
#                 print("game update : ", user)
#                 await self.channel_layer.group_send(
#                     self.room_group_name,
#                     {
#                         "type": "game_update",
#                         "nickname": nickname,
#                         "channel_name": self.channel_name,
#                         "user": user
#                     }
#                 )
#             elif message_type == "chat":
#                 message = text_data_json.get("message")
#                 print("chat message : ", message)
#                 await self.channel_layer.group_send(
#                     self.room_group_name,
#                     {
#                         "type": "chat_message",
#                         "nickname": nickname,
#                         "message": message
#                     }
#                 )
#             elif message_type == "client_left":
#                 print("client left!")
#                 await self.channel_layer.group_send(
#                     self.room_group_name,
#                     {
#                         "type": "client_left"
#                     }
#                 )
#             else:
#                 print("type : ", message_type, " data :", text_data_json.get("data"))

#     async def game_update(self, event):
#         user = event["user"]
#         nickname = event["nickname"]
#         channel_name = event["channel_name"]
        
#         if channel_name == self.channel_name: return
#         await self.send(text_data=json.dumps({"type": "game_update", "nickname": nickname, "user": user}))

#     async def chat_message(self, event):
#         message = event["message"]
#         nickname = event["nickname"]
#         await self.send(text_data=json.dumps({"type": "chat", "nickname": nickname, "message": message}))

#     async def game_ready(self, event):
#         nickname = event.get("nickname")
#         print("nickname : ", nickname)
#         game = await sync_to_async(Game.objects.get)(id=self.room_num)
#         player = await sync_to_async(User.objects.get)(nickname=nickname)
#         player_info = {
#             "nickname": player.nickname,
#             "image": get_image_url(player.image),
#             "win_rate": player.win_rate,
#         }
#         await self.send(text_data=json.dumps({"type": "game_ready", "nickname": nickname, "player_info": player_info}))

#     async def client_left(self, event):
#         await self.send(text_data=json.dumps({"type": "client_left"}))


# class ChatConsumer(AsyncWebsocketConsumer):
#     rooms = {}

#     async def connect(self):
#         self.room_num = self.scope["url_route"]["kwargs"]["room_num"]
#         self.room_group_name = f"chat_{self.room_num}"

#         await self.channel_layer.group_add(self.room_group_name, self.channel_name)
#         await self.accept()

#         if self.room_group_name not in self.rooms:
#             self.rooms[self.room_group_name] = 0

#         self.rooms[self.room_group_name] += 1
#         print(f"connect! Room: {self.room_group_name}, Count: {self.rooms[self.room_group_name]}")
#         print(f"channel name : ", self.channel_name)

#     async def disconnect(self, close_code):
#         print("disconnect!", close_code)

#         await self.channel_layer.group_discard(self.room_group_name, self.channel_name)
#         self.rooms[self.room_group_name] -= 1

#         if self.rooms[self.room_group_name] == 0:
#             del self.rooms[self.room_group_name]

#     async def receive(self, text_data):
#         text_data_json = json.loads(text_data)
#         message_type = text_data_json.get("type")
#         nickname = text_data_json.get("nickname")

#         print("type : ", message_type, " nickname :", nickname)

#         if message_type == "connect":
#             print("connect!")
#             await self.channel_layer.group_send(
#                 self.room_group_name,
#                 {
#                     "type": "chat_message",
#                     "nickname": "System",
#                     "message": f"{nickname}님이 입장하셨습니다."
#                 }
#             )
#         if message_type == "chat":
#             message = text_data_json.get("message")
#             print("chat message : ", message)
#             await self.channel_layer.group_send(
#                 self.room_group_name,
#                 {
#                     "type": "chat_message",
#                     "nickname": nickname,
#                     "message": message
#                 }
#             )
#         else:
#             print("type : ", message_type, " data :", text_data_json.get("data"))

#     async def chat_message(self, event):
#         message = event["message"]
#         nickname = event["nickname"]
#         await self.send(text_data=json.dumps({"type": "chat", "nickname": nickname, "message": message}))