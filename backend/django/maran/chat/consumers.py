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
#             await sync_to_async(self.redis.set)(f"user_channel_{self.user.username}", self.channel_name)
#             await self.accept()

#     async def disconnect(self, close_code):
#         if hasattr(self, 'redis') and self.user.is_authenticated:
#             await sync_to_async(self.redis.delete)(f"user_channel_{self.user.username}")

#             await self.channel_layer.group_discard(
#                 self.room_group_name,
#                 self.channel_name
#             )

#     async def receive(self, text_data):
#         try:
#             text_data_json = json.loads(text_data)
#             message = text_data_json['message']
#             sender_username = text_data_json['username']
#             sender = await sync_to_async(User.objects.get)(username=sender_username)

#             # 메시지를 DB에 저장
#             message_instance = Message(user=sender, content=message)
#             await sync_to_async(message_instance.save)()
            
#             if message.startswith('/w '):
#                 # Extract the recipient and the message
#                 split_message = message.split(' ', 2)
#                 if len(split_message) >= 3:
#                     recipient_username = split_message[1]
#                     message = split_message[2]

#                     try:
#                         recipient = await sync_to_async(User.objects.get)(username=recipient_username)
#                         # 귓속말 메시지를 DB에 저장
#                         message_instance.recipient = recipient
#                         message_instance.content = message
#                         await sync_to_async(message_instance.save)()  # 비동기로 저장

#                         recipient_channel_name = await sync_to_async(self.redis.get)(f"user_channel_{recipient.username}")
#                         if recipient_channel_name:
#                             # Send the whisper to the recipient
#                             await self.channel_layer.send(
#                                 recipient_channel_name.decode('utf-8'),
#                                 {
#                                     'type': 'whisper_message',
#                                     'message': message,
#                                     'sender': sender.username
#                                 }
#                             )
#                             # Send the whisper to the sender as well
#                             await self.send(text_data=json.dumps({
#                                 'message': message,
#                                 'sender': sender.username,
#                                 'whisper': True
#                             }))
#                         else:
#                             await self.send(text_data=json.dumps({
#                                 'error': f'User {recipient_username} is not connected.'
#                             }))
#                     except User.DoesNotExist:
#                         await self.send(text_data=json.dumps({
#                             'error': f'User {recipient_username} does not exist.'
#                         }))
#             else:
#                 await self.channel_layer.group_send(
#                     "chat_group",
#                     {
#                         'type': 'chat_message',
#                         'message': message,
#                         'sender': sender.username
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
#             await sync_to_async(self.redis.set)(f"user_channel_{self.user.username}", self.channel_name)
#             await sync_to_async(self.redis.sadd)("online_users", self.user.username)

#             # Notify the group that a user has connected
#             await self.channel_layer.group_send(
#                 self.room_group_name,
#                 {
#                     'type': 'user_status',
#                     'username': self.user.username,
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
#             await sync_to_async(self.redis.delete)(f"user_channel_{self.user.username}")
#             await sync_to_async(self.redis.srem)("online_users", self.user.username)

#             # Notify the group that a user has disconnected
#             await self.channel_layer.group_send(
#                 self.room_group_name,
#                 {
#                     'type': 'user_status',
#                     'username': self.user.username,
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
#             sender_username = text_data_json['username']
#             sender = await sync_to_async(User.objects.get)(username=sender_username)

#             # 메시지를 DB에 저장
#             message_instance = Message(user=sender, content=message)
#             await sync_to_async(message_instance.save)()
            
#             if message.startswith('/w '):
#                 # Extract the recipient and the message
#                 split_message = message.split(' ', 2)
#                 if len(split_message) >= 3:
#                     recipient_username = split_message[1]
#                     message = split_message[2]

#                     try:
#                         recipient = await sync_to_async(User.objects.get)(username=recipient_username)
#                         # 귓속말 메시지를 DB에 저장
#                         message_instance.recipient = recipient
#                         message_instance.content = message
#                         await sync_to_async(message_instance.save)()  # 비동기로 저장

#                         recipient_channel_name = await sync_to_async(self.redis.get)(f"user_channel_{recipient.username}")
#                         if recipient_channel_name:
#                             # Send the whisper to the recipient
#                             await self.channel_layer.send(
#                                 recipient_channel_name.decode('utf-8'),
#                                 {
#                                     'type': 'whisper_message',
#                                     'message': message,
#                                     'sender': sender.username
#                                 }
#                             )
#                             # Send the whisper to the sender as well
#                             await self.send(text_data=json.dumps({
#                                 'message': message,
#                                 'sender': sender.username,
#                                 'whisper': True
#                             }))
#                         else:
#                             await self.send(text_data=json.dumps({
#                                 'error': f'User {recipient_username} is not connected.'
#                             }))
#                     except User.DoesNotExist:
#                         await self.send(text_data=json.dumps({
#                             'error': f'User {recipient_username} does not exist.'
#                         }))
#             else:
#                 await self.channel_layer.group_send(
#                     "chat_group",
#                     {
#                         'type': 'chat_message',
#                         'message': message,
#                         'sender': sender.username
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
#         username = event['username']
#         status = event['status']

#         await self.send(text_data=json.dumps({
#             'username': username,
#             'status': status
#         }))

import json
from channels.generic.websocket import AsyncWebsocketConsumer
from django.utils import timezone
from django.conf import settings
from user.models import User
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
            await sync_to_async(self.redis.set)(f"user_channel_{self.user.username}", self.channel_name)
            
            await self.accept()

            # 사용자 접속 상태 업데이트
            await sync_to_async(self.update_user_status)(self.user.username, True)

            await self.channel_layer.group_send(
                self.room_group_name,
                {
                    'type': 'user_status',
                    'username': self.user.username,
                    'status': 'online'
                }
            )

    async def disconnect(self, close_code):
        if hasattr(self, 'redis') and self.user.is_authenticated:
            await sync_to_async(self.redis.delete)(f"user_channel_{self.user.username}")

            await self.channel_layer.group_discard(
                self.room_group_name,
                self.channel_name
            )

            # 사용자 접속 상태 업데이트
            await sync_to_async(self.update_user_status)(self.user.username, False)

            await self.channel_layer.group_send(
                self.room_group_name,
                {
                    'type': 'user_status',
                    'username': self.user.username,
                    'status': 'offline'
                }
            )

    async def receive(self, text_data):
        try:
            text_data_json = json.loads(text_data)
            message = text_data_json['message']
            sender_username = text_data_json['username']
            sender = await sync_to_async(User.objects.get)(username=sender_username)

            message_instance = Message(user=sender, content=message)
            await sync_to_async(message_instance.save)()

            if message.startswith('/w '):
                split_message = message.split(' ', 2)
                if len(split_message) >= 3:
                    recipient_username = split_message[1]
                    message = split_message[2]

                    try:
                        recipient = await sync_to_async(User.objects.get)(username=recipient_username)
                        message_instance.recipient = recipient
                        message_instance.content = message
                        await sync_to_async(message_instance.save)()

                        recipient_channel_name = await sync_to_async(self.redis.get)(f"user_channel_{recipient.username}")
                        if recipient_channel_name:
                            await self.channel_layer.send(
                                recipient_channel_name.decode('utf-8'),
                                {
                                    'type': 'whisper_message',
                                    'message': message,
                                    'sender': sender.username
                                }
                            )
                            await self.send(text_data=json.dumps({
                                'message': message,
                                'sender': sender.username,
                                'whisper': True
                            }))
                        else:
                            await self.send(text_data=json.dumps({
                                'error': f'User {recipient_username} is not connected.'
                            }))
                    except User.DoesNotExist:
                        await self.send(text_data=json.dumps({
                            'error': f'User {recipient_username} does not exist.'
                        }))
            else:
                await self.channel_layer.group_send(
                    "chat_group",
                    {
                        'type': 'chat_message',
                        'message': message,
                        'sender': sender.username
                    }
                )
        except json.JSONDecodeError:
            await self.send(text_data=json.dumps({
                'error': 'Invalid JSON'
            }))

    async def chat_message(self, event):
        message = event['message']
        sender = event['sender']

        await self.send(text_data=json.dumps({
            'message': message,
            'sender': sender
        }))

    async def whisper_message(self, event):
        message = event['message']
        sender = event['sender']

        await self.send(text_data=json.dumps({
            'message': message,
            'sender': sender,
            'whisper': True
        }))

    async def user_status(self, event):
        username = event['username']
        status = event['status']

        await self.send(text_data=json.dumps({
            'type': 'user_status',
            'username': username,
            'status': status
        }))
    
    def update_user_status(self, username, is_online):
        user = User.objects.get(username=username)
        user.is_online = is_online
        if not is_online:
            user.last_online = timezone.now()
        user.save()
