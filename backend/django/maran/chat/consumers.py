import json
from channels.generic.websocket import AsyncWebsocketConsumer
from channels.db import database_sync_to_async
from django.utils import timezone
from django.conf import settings
from user.models import User
from game.models import Game
from tournament.models import Tournament
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
            elif type == 'tournament_invite':
                receiver_nickname = text_data_json['receiver']
                try:
                    receiver = await sync_to_async(User.objects.get)(nickname=receiver_nickname)
                    tournament = await sync_to_async(Tournament.objects.first)()
                    if receiver.is_online:
                        receiver_channel_name = await sync_to_async(self.redis.get)(f"user_channel_{receiver.nickname}")
                        if receiver_channel_name:
                            if tournament.is_active == True:
                                await self.send(text_data=json.dumps({
                                    'message': "Tournament is already started.",
                                    'sender': 'system',
                                    'whisper': True,
                                    'receiver': sender.nickname
                                }))
                            elif await sync_to_async(tournament.participants.count)() >= 4:
                                await self.send(text_data=json.dumps({
                                    'message': "Tournament is already full.",
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
                                        'type': 'tournament_invite_message',
                                        'sender': sender.nickname,
                                        'receiver' : receiver.nickname,
                                    }
                                )
                    else:
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
                except Tournament.DoesNotExist:
                    await self.send(text_data=json.dumps({
                        'message': "Game is not exist.",
                        'sender': 'system',
                        'whisper': True,
                        'receiver': sender.nickname
                    }))
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
            elif type == 'update': # 친구 상태 업데이트 받음
                status = text_data_json['status']
                await self.send(text_data=json.dumps({
                    'message': "update",
                    'sender' : sender.nickname,
                    'status' : status
                }))
            elif type == 'connect':
                friends = await self.get_user_friends(sender_nickname)
                await self.send(text_data=json.dumps({
                    'type': 'connect',
                    'sender': sender_nickname,
                    'friends': friends
                }))
            elif type == 'tournament_in':  # 유저가 토너먼트에 입장할 때
                await self.channel_layer.group_add(
                    'tournament_group',
                    self.channel_name
                )
                await self.channel_layer.group_send(
                    'tournament_group',
                    {
                        'type': 'tournament_in',
                        'status': 'new-user',
                        'nickname': sender.nickname
                    }
                )
                tournament = await sync_to_async(Tournament.objects.first)()
                if tournament and await sync_to_async(tournament.participants.count)() == 4:
                    host = await sync_to_async(lambda: tournament.host)()
                    if host:
                        host_channel_name = await sync_to_async(self.redis.get)(f"user_channel_{host.nickname}")
                        if host_channel_name:
                            await self.channel_layer.send(
                                host_channel_name.decode('utf-8'),
                                {
                                    'type': 'whisper_message',
                                    'message': "Tournament is ready to start.",
                                    'sender': 'system',
                                    'receiver': host.nickname
                                }
                            )
            elif type == 'tournament_out':
                await self.channel_layer.group_send(
                    'tournament_group',
                    {
                        'type': 'tournament_out',
                        'status': 'out-user',
                        'nickname': sender.nickname
                    }
                )
                await self.channel_layer.group_discard(
                    'tournament_group',
                    self.channel_name
                )
            elif type == 'tournament_start':
                tournament = await sync_to_async(Tournament.objects.first)()
                if tournament and tournament.is_active:
                    await self.channel_layer.group_send(
                        'tournament_group',
                        {
                            'type':'tournament_start',
                        }
                    )
            elif type == 'tournament_end':
                tournament = await sync_to_async(Tournament.objects.first)()
                if tournament and tournament.is_active:
                    participants = await sync_to_async(tournament.get_participants)()
                    cnt = await sync_to_async(participants.count)()
                    if cnt == 4 or cnt == 3:
                        await self.channel_layer.group_send(
                            'tournament_group',
                            {
                                'type': 'tournament_semifinal_end',
                                'status': 'tournament_semifinal_end',
                            }
                        )
                    elif cnt == 2:
                        winner_nickname = text_data_json['winner_nickname']
                        await self.channel_layer.group_send(
                            'tournament_group',
                            {
                                'type': 'tournament_final_end',
                                'status': 'tournament_final_end',
                            }
                        )
                        await self.channel_layer.group_send(
                            "chat_group",
                            {
                                'type': 'chat_message',
                                'message': winner_nickname + ' is win tournament!!',
                                'sender': 'system'
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

    async def tournament_invite_message(self, event):
        sender = event['sender']
        await self.send(text_data=json.jumps({
            'type': 'tournament_invite',
            'sender': sender,
        }))

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

    async def tournament_in(self, event):
        status = event['status']
        nickname = event['nickname']

        await self.send(text_data=json.dumps({
            'type': 'tournament_in',
            'status': status,
            'nickname': nickname
        }))

    async def tournament_out(self, event):
        status = event['status']
        nickname = event['nickname']

        await self.send(text_data=json.dumps({
            'type': 'tournament_out',
            'status': status,
            'nickname': nickname
        }))

    async def tournament_start(self, event):
        await self.send(text_data=json.dumps({
            'type': 'tournament_start',
        }))

    async def tournament_semifinal_end(self, event):
        status = event['status']

        await self.send(text_data=json.dumps({
            'type': 'tournament_semifinal_end',
            'status': status,
        }))

    async def tournament_final_end(self, event):
        status = event['status']

        await self.send(text_data=json.dumps({
            'type': 'tournament_final_end',
            'status': status,
        }))

    @database_sync_to_async
    def get_user_friends(self, nickname):
        user = User.objects.get(nickname=nickname)
        friends = list(user.friends.all().values('nickname', 'is_online'))
        friends_list = [{'nickname': friend['nickname'], 'status': friend['is_online']} for friend in friends]
        return friends_list

