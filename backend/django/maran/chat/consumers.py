# import json
# from channels.generic.websocket import AsyncWebsocketConsumer
# from django.conf import settings
# from user.models import User
# from .models import Message
# from rest_framework_simplejwt.tokens import AccessToken
# from asgiref.sync import sync_to_async
# import redis
# import asyncio

# class ChatConsumer(AsyncWebsocketConsumer):
#     async def connect(self):
#         self.user = self.scope["user"]

#         if self.user.is_anonymous:
#             await self.close()
#         else:
#             self.room_group_name = "chat_group"
#             # 전체채팅 그룹에 사용자 추가
#             await self.channel_layer.group_add(
#                 self.room_group_name,
#                 self.channel_name
#             )
#             # Redis에 해당 유저의 채널명(귓속말) 저장
#             self.redis = await sync_to_async(redis.Redis)(host='redis', port=6379, db=0)
#             await sync_to_async(self.redis.set)(f"user_channel_{self.user.nickname}", self.channel_name)
#             await self.accept()

#     async def disconnect(self, close_code):
#         if hasattr(self, 'redis') and self.user.is_authenticated:
#             await sync_to_async(self.redis.delete)(f"user_channel_{self.user.nickname}")

#             await self.channel_layer.group_discard(
#                 self.room_group_name,
#                 self.channel_name
#             )

#     async def receive(self, text_data):
#         try:
#             text_data_json = json.loads(text_data)
#             message = text_data_json['message']
#             sender_nickname = text_data_json['nickname']
#             sender = await sync_to_async(User.objects.get)(nickname=sender_nickname)

#             # 메시지를 DB에 저장
#             message_instance = Message(user=sender, content=message)
#             await sync_to_async(message_instance.save)()
            
#             if message.startswith('/w '):
#                 # Extract the recipient and the message
#                 split_message = message.split(' ', 2)
#                 if len(split_message) >= 3:
#                     recipient_nickname = split_message[1]
#                     message = split_message[2]

#                     try:
#                         recipient = await sync_to_async(User.objects.get)(nickname=recipient_nickname)
#                         # 귓속말 메시지를 DB에 저장
#                         message_instance.recipient = recipient
#                         message_instance.content = message
#                         await sync_to_async(message_instance.save)()  # 비동기로 저장

#                         recipient_channel_name = await sync_to_async(self.redis.get)(f"user_channel_{recipient.nickname}")
#                         if recipient_channel_name:
#                             # Send the whisper to the recipient
#                             await self.channel_layer.send(
#                                 recipient_channel_name.decode('utf-8'),
#                                 {
#                                     'type': 'whisper_message',
#                                     'message': message,
#                                     'sender': sender.nickname
#                                 }
#                             )
#                             # Send the whisper to the sender as well
#                             await self.send(text_data=json.dumps({
#                                 'message': message,
#                                 'sender': sender.nickname,
#                                 'whisper': True
#                             }))
#                         else:
#                             await self.send(text_data=json.dumps({
#                                 'error': f'User {recipient_nickname} is not connected.'
#                             }))
#                     except User.DoesNotExist:
#                         await self.send(text_data=json.dumps({
#                             'error': f'User {recipient_nickname} does not exist.'
#                         }))
#             else:
#                 await self.channel_layer.group_send(
#                     "chat_group",
#                     {
#                         'type': 'chat_message',
#                         'message': message,
#                         'sender': sender.nickname
#                     }
#                 )
#         except json.JSONDecodeError:
#             await self.send(text_data=json.dumps({
#                 'error': 'Invalid JSON'
#             }))

#     async def chat_message(self, event):
#         message = event['message']
#         sender = event['sender']

#         await self.send(text_data=json.dumps({
#             'message': message,
#             'sender': sender
#         }))

#     async def whisper_message(self, event):
#         message = event['message']
#         sender = event['sender']

#         await self.send(text_data=json.dumps({
#             'message': message,
#             'sender': sender,
#             'whisper': True
#         }))

# import json
# from channels.generic.websocket import AsyncWebsocketConsumer
# from django.conf import settings
# from user.models import User
# from .models import Message
# from asgiref.sync import sync_to_async
# import redis
# import asyncio

# class ChatConsumer(AsyncWebsocketConsumer):
#     async def connect(self):
#         self.user = self.scope["user"]

#         if self.user.is_anonymous:
#             await self.close()
#         else:
#             self.room_group_name = "chat_group"
#             # Join the public chat group
#             await self.channel_layer.group_add(
#                 self.room_group_name,
#                 self.channel_name
#             )
#             # Store the channel name for the user in Redis
#             self.redis = await sync_to_async(redis.Redis)(host='redis', port=6379, db=0)
#             await sync_to_async(self.redis.set)(f"user_channel_{self.user.nickname}", self.channel_name)
#             await sync_to_async(self.redis.sadd)("online_users", self.user.nickname)

#             # Notify the group that a user has connected
#             await self.channel_layer.group_send(
#                 self.room_group_name,
#                 {
#                     'type': 'user_status',
#                     'nickname': self.user.nickname,
#                     'status': 'online'
#                 }
#             )

#             # Get the list of currently online users
#             online_users = await sync_to_async(self.redis.smembers)("online_users")
#             online_users = [user.decode('utf-8') for user in online_users]

#             await self.accept()

#             # Send the list of online users to the new user
#             await self.send(text_data=json.dumps({
#                 'type': 'online_users',
#                 'users': online_users
#             }))

#     async def disconnect(self, close_code):
#         if hasattr(self, 'redis') and self.user.is_authenticated:
#             await sync_to_async(self.redis.delete)(f"user_channel_{self.user.nickname}")
#             await sync_to_async(self.redis.srem)("online_users", self.user.nickname)

#             # Notify the group that a user has disconnected
#             await self.channel_layer.group_send(
#                 self.room_group_name,
#                 {
#                     'type': 'user_status',
#                     'nickname': self.user.nickname,
#                     'status': 'offline'
#                 }
#             )

#             await self.channel_layer.group_discard(
#                 self.room_group_name,
#                 self.channel_name
#             )

#     async def receive(self, text_data):
#         try:
#             text_data_json = json.loads(text_data)
#             message = text_data_json['message']
#             sender_nickname = text_data_json['nickname']
#             sender = await sync_to_async(User.objects.get)(nickname=sender_nickname)

#             # 메시지를 DB에 저장
#             message_instance = Message(user=sender, content=message)
#             await sync_to_async(message_instance.save)()
            
#             if message.startswith('/w '):
#                 # Extract the recipient and the message
#                 split_message = message.split(' ', 2)
#                 if len(split_message) >= 3:
#                     recipient_nickname = split_message[1]
#                     message = split_message[2]

#                     try:
#                         recipient = await sync_to_async(User.objects.get)(nickname=recipient_nickname)
#                         # 귓속말 메시지를 DB에 저장
#                         message_instance.recipient = recipient
#                         message_instance.content = message
#                         await sync_to_async(message_instance.save)()  # 비동기로 저장

#                         recipient_channel_name = await sync_to_async(self.redis.get)(f"user_channel_{recipient.nickname}")
#                         if recipient_channel_name:
#                             # Send the whisper to the recipient
#                             await self.channel_layer.send(
#                                 recipient_channel_name.decode('utf-8'),
#                                 {
#                                     'type': 'whisper_message',
#                                     'message': message,
#                                     'sender': sender.nickname
#                                 }
#                             )
#                             # Send the whisper to the sender as well
#                             await self.send(text_data=json.dumps({
#                                 'message': message,
#                                 'sender': sender.nickname,
#                                 'whisper': True
#                             }))
#                         else:
#                             await self.send(text_data=json.dumps({
#                                 'error': f'User {recipient_nickname} is not connected.'
#                             }))
#                     except User.DoesNotExist:
#                         await self.send(text_data=json.dumps({
#                             'error': f'User {recipient_nickname} does not exist.'
#                         }))
#             else:
#                 await self.channel_layer.group_send(
#                     "chat_group",
#                     {
#                         'type': 'chat_message',
#                         'message': message,
#                         'sender': sender.nickname
#                     }
#                 )
#         except json.JSONDecodeError:
#             await self.send(text_data=json.dumps({
#                 'error': 'Invalid JSON'
#             }))

#     async def chat_message(self, event):
#         message = event['message']
#         sender = event['sender']

#         await self.send(text_data=json.dumps({
#             'message': message,
#             'sender': sender
#         }))

#     async def whisper_message(self, event):
#         message = event['message']
#         sender = event['sender']

#         await self.send(text_data=json.dumps({
#             'message': message,
#             'sender': sender,
#             'whisper': True
#         }))

#     async def user_status(self, event):
#         nickname = event['nickname']
#         status = event['status']

#         await self.send(text_data=json.dumps({
#             'nickname': nickname,
#             'status': status
#         }))

import json
from channels.generic.websocket import AsyncWebsocketConsumer
from channels.db import database_sync_to_async
from django.utils import timezone
from django.conf import settings
from user.models import User
from game.models import Game
from .models import Message
from rest_framework_simplejwt.tokens import AccessToken
from asgiref.sync import sync_to_async
import redis
import asyncio

class ChatConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        self.user = self.scope["user"]
        if self.user.is_anonymous:
            await self.close()
        else:
            self.room_group_name = "chat_group"
            await self.channel_layer.group_add(
                self.room_group_name,
                self.channel_name
            )
            self.redis = await sync_to_async(redis.Redis)(host='redis', port=6379, db=0)
            await sync_to_async(self.redis.set)(f"user_channel_{self.user.nickname}", self.channel_name)
            
            await self.accept()

            # 사용자 접속 상태 업데이트
            await sync_to_async(self.update_user_status)(self.user.nickname, True)

            await self.channel_layer.group_send(
                self.room_group_name,
                {
                    'type': 'user_status',
                    'nickname': self.user.nickname,
                    'status': 'on'
                }
            )

    async def disconnect(self, close_code):
        if hasattr(self, 'redis') and self.user.is_authenticated:
            await sync_to_async(self.redis.delete)(f"user_channel_{self.user.nickname}")

            await self.channel_layer.group_discard(
                self.room_group_name,
                self.channel_name
            )

            # 사용자 접속 상태 업데이트
            await sync_to_async(self.update_user_status)(self.user.nickname, False)

            await self.channel_layer.group_send(
                self.room_group_name,
                {
                    'type': 'user_status',
                    'nickname': self.user.nickname,
                    'status': 'off'
                }
            )

    async def receive(self, text_data):
        try:
            text_data_json = json.loads(text_data)
            type = text_data_json['type']
            sender_nickname = text_data_json['sender']
            sender = await sync_to_async(User.objects.get)(nickname=sender_nickname)
            
            if type == 'whisper' or type == 'all':
                message = text_data_json['message']
                message_instance = Message(user=sender, content=message)
                message_instance.receiver = None
                await sync_to_async(message_instance.save)()

            # 타입이 귓속말일 때
            if type == 'whisper':
                receiver_nickname = text_data_json['receiver']
                try:
                    receiver = await sync_to_async(User.objects.get)(nickname=receiver_nickname)
                    message_instance.receiver = receiver
                    message_instance.content = message
                    await sync_to_async(message_instance.save)()

                    receiver_channel_name = await sync_to_async(self.redis.get)(f"user_channel_{receiver.nickname}")
                    if receiver_channel_name:
                        await self.channel_layer.send(
                            receiver_channel_name.decode('utf-8'),
                            {
                                'type': 'whisper_message',
                                'message': message,
                                'sender': sender.nickname,
                                'receiver': receiver.nickname
                            }
                        )
                        await self.send(text_data=json.dumps({
                            'message': message,
                            'sender': sender.nickname,
                            'whisper': True,
                            'receiver': receiver.nickname
                        }))
                    else: # 수신자가 오프라인인 경우
                        await self.send(text_data=json.dumps({
                            'message': "User is not connected.",
                            'sender': 'system',
                            'whisper': True,
                            'receiver': sender.nickname
                        }))
                except User.DoesNotExist: # 수신자가 존재하지 않는 경우
                    await self.send(text_data=json.dumps({
                            'message': "User does not exist.",
                            'sender': 'system',
                            'whisper': True,
                            'receiver': sender.nickname
                        }))
            elif type == 'all':
                await self.channel_layer.group_send(
                    "chat_group",
                    {
                        'type': 'chat_message',
                        'message': message,
                        'sender': sender.nickname
                    }
                )
            elif type == 'invite':
                receiver_nickname = text_data_json['receiver']
                gameId = text_data_json['gameId']
                try:
                    receiver = await sync_to_async(User.objects.get)(nickname=receiver_nickname)
                    game = await sync_to_async(Game.objects.get)(id=gameId)
                    if receiver.is_online: # 수신자가 온라인인 경우
                        receiver_channel_name = await sync_to_async(self.redis.get)(f"user_channel_{receiver.nickname}")
                        if receiver_channel_name:
                            if game.status == 1 : # 게임이 이미 시작된 경우
                                await self.send(text_data=json.dumps({
                                'message': "Game is already started.",
                                'sender': 'system',
                                'whisper': True,
                                'receiver': sender.nickname
                                }))
                            elif await sync_to_async(game.players.count)() >= 2:
                                await self.send(text_data=json.dumps({
                                'message': "Game is already full.",
                                'sender': 'system',
                                'whisper': True,
                                'receiver': sender.nickname
                                }))
                            else:
                                await self.send(text_data=json.dumps({
                                'message': "성공적으로 초대를 전송했습니다.",
                                'sender': 'system',
                                'whisper': True,
                                'receiver': sender.nickname
                                }))
                                await self.channel_layer.send(
                                    receiver_channel_name.decode('utf-8'),
                                    {
                                        'type': 'invite_message',
                                        'sender': sender.nickname,
                                        'receiver' : receiver.nickname,
                                        'gameId': gameId
                                    }
                                )
                    elif type == 'update': # 친구 상태 업데이트 받음
                        status = text_data_json['status']
                        await self.send(text_data=json.dumps({
                            'message': "update",
                            'sender' : sender.nickname,
                            'status' : status
                            }))
                    else: # 수신자가 오프라인인 경우
                           await self.send(text_data=json.dumps({
                                'message': "User is not connected.",
                                'sender': 'system',
                                'whisper': True,
                                'receiver': sender.nickname
                                }))
                except User.DoesNotExist:
                          await self.send(text_data=json.dumps({
                                'message': "User does not exist.",
                                'sender': 'system',
                                'whisper': True,
                                'receiver': sender.nickname
                                }))
                except Game.DoesNotExist:
                       await self.send(text_data=json.dumps({
                                'message': "Game is not exist.",
                                'sender': 'system',
                                'whisper': True,
                                'receiver': sender.nickname
                                }))
        except json.JSONDecodeError:
            await self.send(text_data=json.dumps({
                'error': 'Invalid JSON'
            }))

    async def chat_message(self, event):
        message = event['message']
        sender = event['sender']

        await self.send(text_data=json.dumps({
            'type' : 'all',
            'message': message,
            'sender': sender
        }))

    async def whisper_message(self, event):
        message = event['message']
        sender = event['sender']

        await self.send(text_data=json.dumps({
            'message': message,
            'sender': sender,
            'type' : 'whisper',
            'whisper': True
        }))

    async def user_status(self, event):
        # 친구들한테 사용자의 온라인/오프라인 상태 알림
        nickname = event['nickname']
        status = event['status']

        friends = await self.get_user_friends(nickname)

        if status == 'on' and nickname == self.user.nickname:
            #처음 접속한 경우 본인에게 친구들의 접속 상태 반환
            await self.send(text_data=json.dumps({
                'type': 'connect',
                'sender': nickname,
                'friends': friends
            }))
            
        if nickname != self.user.nickname and any(friend['nickname'] == self.user.nickname for friend in friends):
            await self.send(text_data=json.dumps({
                'type': 'update',
                'sender': nickname,
                'status': status
            }))


    def update_user_status(self, nickname, is_online):
        user = User.objects.get(nickname=nickname)
        user.is_online = is_online
        if not is_online:
            user.last_online = timezone.now()
        user.save()

    async def invite_message(self, event):
        sender = event['sender']
        gameId = event['gameId']
        await self.send(text_data=json.dumps({
            'type': 'invite',
            'sender': sender,
            'gameId': gameId
        }))

    async def update(self, event):
        sender = event['sender']
        status = event['status']
        await self.send(text_data=json.dumps({
            'type': 'update',
            'sender': sender,
            'status': status
        }))
        


    @database_sync_to_async
    def get_user_friends(self, nickname):
        user = User.objects.get(nickname=nickname)
        friends = list(user.friends.all().values('nickname', 'is_online'))
        friends_list = [{'nickname': friend['nickname'], 'status': friend['is_online']} for friend in friends]
        return friends_list