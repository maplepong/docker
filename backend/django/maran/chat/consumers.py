import json
from channels.generic.websocket import AsyncWebsocketConsumer
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
            # Join the public chat group
            await self.channel_layer.group_add(
                self.room_group_name,
                self.channel_name
            )
            # Store the channel name for the user in Redis
            self.redis = await sync_to_async(redis.Redis)(host='redis', port=6379, db=0)
            await sync_to_async(self.redis.set)(f"user_channel_{self.user.username}", self.channel_name)

            # 저장된 채널 이름을 다시 가져와서 출력
            stored_channel_name = await sync_to_async(self.redis.get)(f"user_channel_{self.user.username}")

            await self.accept()

    async def disconnect(self, close_code):
        if hasattr(self, 'redis') and self.user.is_authenticated:
            await sync_to_async(self.redis.delete)(f"user_channel_{self.user.username}")

            await self.channel_layer.group_discard(
                self.room_group_name,
                self.channel_name
            )

    async def receive(self, text_data):
        try:
            text_data_json = json.loads(text_data)
            message = text_data_json['message']
            sender_username = text_data_json['username']
            sender = await sync_to_async(User.objects.get)(username=sender_username)

            # 메시지를 DB에 저장
            message_instance = Message(user=sender, content=message)
            await sync_to_async(message_instance.save)()
            
            if message.startswith('/w '):
                # Extract the recipient and the message
                split_message = message.split(' ', 2)
                if len(split_message) >= 3:
                    recipient_username = split_message[1]
                    message = split_message[2]

                    try:
                        recipient = await sync_to_async(User.objects.get)(username=recipient_username)
                        # 귓속말 메시지를 DB에 저장
                        message_instance.recipient = recipient
                        message_instance.content = message
                        await sync_to_async(message_instance.save)()  # 비동기로 저장

                        recipient_channel_name = await sync_to_async(self.redis.get)(f"user_channel_{recipient.username}")
                        if recipient_channel_name:
                            # Send the whisper to the recipient
                            await self.channel_layer.send(
                                recipient_channel_name.decode('utf-8'),
                                {
                                    'type': 'whisper_message',
                                    'message': message,
                                    'sender': sender.username
                                }
                            )
                            # Send the whisper to the sender as well
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