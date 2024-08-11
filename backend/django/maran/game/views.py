from django.shortcuts import render, redirect
from .models import Game, GameInfo, GameInviteRequest
from django.contrib.auth.decorators import login_required
from rest_framework.decorators import (
    api_view,
    permission_classes,
    authentication_classes,
)
from rest_framework.permissions import IsAuthenticated
from rest_framework_simplejwt.authentication import JWTAuthentication
from django.shortcuts import render
from django.http import HttpResponse, JsonResponse
from rest_framework.response import Response
from rest_framework.decorators import (
    api_view,
    permission_classes,
    authentication_classes,
)
from rest_framework import status
from user.models import User, FriendRequest, GameRecord
from user.image import get_image_url
from requests import Request
from django.contrib.auth import get_user_model
from django.contrib.auth import login as auth_login
from django.contrib.auth import authenticate
from django.contrib.auth import update_session_auth_hash
from django.contrib.auth.decorators import login_required
from django.contrib.auth import logout as auth_logout
from rest_framework.permissions import AllowAny
from decouple import config
import json
from rest_framework.permissions import IsAuthenticated
from rest_framework_simplejwt.authentication import JWTAuthentication
import logging
import hashlib
import os


from rest_framework import serializers

class GameInfoSerializer(serializers.Serializer):
    id = serializers.IntegerField()
    name = serializers.CharField()
    current_players_num = serializers.IntegerField()
    players = serializers.ListField()
    owner = serializers.CharField()
    password = serializers.CharField()
    status = serializers.CharField()

class GameUserSerializer(serializers.Serializer):
    nickname = serializers.CharField()
    win_rate = serializers.IntegerField()
    image = serializers.CharField()


def index(request):
    return render(request, "game/index.html")

def get_game_user_info(user):
    return GameUserSerializer({
        'nickname': user.nickname,
        'win_rate': user.win_rate,
        'image': get_image_url(user.image),
    }).data


def get_game_info(game):
    return GameInfoSerializer({
        'id': game.id,
        'name': game.name,
        'current_players_num': game.players.count(),
        'players': [get_game_user_info(player) for player in game.players.all()],
        'owner': game.creator.nickname,
        'password': game.password,
        'status': game.status,
    }).data

@api_view(["GET"])
@permission_classes((IsAuthenticated,))
@authentication_classes((JWTAuthentication,))
def get_game_list(request):
    org_games = Game.objects.all()
    games = [get_game_info(game) for game in org_games]
    return Response({"games": games})


@api_view(["POST"])
@permission_classes((IsAuthenticated,))
@authentication_classes((JWTAuthentication,))
def new(request):
    room_title = request.data.get("room_title")
    if not room_title:
        return Response({"detail": "Room title is required"}, status=status.HTTP_400_BAD_REQUEST)
    game = Game(name=room_title, creator=request.user)
    if request.data.get("password"):
        game.password = request.data.get("password")
    game.save()
    game.players.add(request.user)
    return Response({"id" : game.id, "game name: ": game.name}, status = status.HTTP_201_CREATED)

@api_view(["GET"])
@permission_classes((IsAuthenticated,))
@authentication_classes((JWTAuthentication,))
def game_info(request, game_id):
    game = Game.objects.get(id=game_id)
    game_info = get_game_info(game)
    return Response(game_info, status=status.HTTP_200_OK)

@api_view(["POST"])
@permission_classes((IsAuthenticated,))
@authentication_classes((JWTAuthentication,))
def enter(request):
    game_id = request.data.get("id")
    game = Game.objects.get(id=game_id)
    if game.players.count() >= 2 and request.user not in game.players.all():
        return Response({"detail": "Game is full"}, status = status.HTTP_409_CONFLICT)
    if game.password:
        request_pwd = request.data.get("password")
        if not request_pwd:
            return Response({"detail": "Password is required"}, status=status.HTTP_400_BAD_REQUEST)
        if request_pwd != game.password:
            return Response({"detail": "Invalid password"}, status=status.HTTP_403_FORBIDDEN)
    game.players.add(request.user)
    return Response(status=status.HTTP_201_CREATED)

@api_view(["GET"])
@permission_classes((IsAuthenticated,))
@authentication_classes((JWTAuthentication,))
def start(request, game_id):
    game = Game.objects.get(id=game_id)
    if game.creator != request.user:
        return Response({"detail": "You are not the owner of this game room"}, status=status.HTTP_403_FORBIDDEN)
    if game.players.count() < 2:
        return Response({"detail": "The game room is not full yet"}, status=status.HTTP_400_BAD_REQUEST)
    game.status = 1
    game.save()
    return Response({"detail": "Game started successfully"}, status=status.HTTP_200_OK)


@api_view(["DELETE"])
@permission_classes((IsAuthenticated,))
@authentication_classes((JWTAuthentication,))
def exit(request, game_id):
    try:
        game = Game.objects.get(id=game_id)
    except Game.DoesNotExist:
        return Response({"detail": "Game not found"}, status=status.HTTP_404_NOT_FOUND)
    game.players.remove(request.user)
    if game.players.count() == 0:
        game.delete()
        return Response({"detail": "Successfully exited the game room and the game room has been deleted"}, status=status.HTTP_200_OK)
    anothor = game.players.all()[0]
    game.creator = anothor
    game.save()
    return Response({"detail": "Successfully exited the game room"}, status=status.HTTP_200_OK)

@api_view(["POST"])
@permission_classes((IsAuthenticated,))
@authentication_classes((JWTAuthentication,))
def invite(request):      #게임방 초대 보내기
    game_id = request.data.get("id")
    nickname = request.data.get("nickname")
    game = Game.objects.get(id=game_id)
    if request.method == "POST":
        try:
            to_user = User.objects.get(nickname=nickname)
        except User.DoesNotExist:   #초대하는 유저가 존재하지 않을 경우
            return Response(
                {"error": "user is not found"}, status = status.HTTP_404_NOT_FOUND
            )
        if to_user in game.players.all():   # 초대한 유저가 이미 게임방에 있는 경우
            return Response({"error": "User is already in the game room"}, status=status.HTTP_400_BAD_REQUEST)
        if game.players.count() == 2:   #이미 게임방에 2명이 가득 차있을경우
            return Response({"error": "Game room is full"}, status=status.HTTP_403_FORBIDDEN)
        if to_user == request.user:     #초대한 유저가 본인일 경우
            return Response({"error": "to_user is request user"}, status=status.HTTP_400_BAD_REQUEST)
        try:
            existing_request = GameInviteRequest.objects.get(from_user=request.user, to_user=to_user, game_id=game_id)
            existing_request.delete()  # 이미 보낸 초대가 있으면 삭제
        except GameInviteRequest.DoesNotExist:
            pass
        GameInviteRequest.objects.create(from_user=request.user, to_user=to_user, game_id=game_id)
        return Response({"detail": "Successfully invited"}, status=status.HTTP_200_OK)
    return Response({"error": "something is wrong"}, status=status.HTTP_400_BAD_REQUEST)

@api_view(["GET"])
@permission_classes((IsAuthenticated,))
@authentication_classes((JWTAuthentication,))
def game_invite_list(request):
    if request.method == "GET":
        sends_requests = GameInviteRequest.objects.filter(from_user=request.user)
        receives_requests = GameInviteRequest.objects.filter(to_user=request.user)
        
        if not sends_requests and not receives_requests:
            return Response(status=status.HTTP_204_NO_CONTENT)
        
        sends = [
            {
                "from_user": game_request.from_user.nickname,
                "to_user": game_request.to_user.nickname,
                "game_id": game_request.game_id,
            }
            for game_request in sends_requests
        ]
        receives = [
            {
                "from_user": game_request.from_user.nickname,
                "to_user": game_request.to_user.nickname,
                "game_id": game_request.game_id,
            }
            for game_request in receives_requests
        ]

        data = {
            "sends": sends,
            "receives": receives,
        }
        return Response(data, status=status.HTTP_200_OK)

#게임 수락했는데 이미 방 폭파한 경우 에러 돌려줘야함
@api_view(["POST", "DELETE"])
@permission_classes((IsAuthenticated,))
@authentication_classes((JWTAuthentication,))
def game_request(request):
    game_id = request.data.get("id")
    nickname = request.data.get("nickname")
    try:
        to_user = User.objects.get(nickname=nickname)
    except User.DoesNotExist:
        return Response(
            {"error": "User with the provided nickname does not exist"},
            status=status.HTTP_404_NOT_FOUND,
        )
    if request.method == "POST":    #나한테 온 게임 초대 수락
        try:
            from_user = User.objects.get(nickname=nickname)
            game_request = GameInviteRequest.objects.get(
                from_user=from_user, to_user=request.user, game_id=game_id
            )
            if game_request.to_user != request.user:
                return Response(
                    {"error": "user not recieved request"},
                    status=status.HTTP_400_BAD_REQUEST,
                )
            try:
                game = Game.objects.get(id=game_id)  # 게임 가져오기
            except Game.DoesNotExist:
                game_request.delete()  # 게임이 존재하지 않으면 게임 초대 삭제
                return Response(
                    {"error": "Game does not exist"},
                    status=status.HTTP_404_NOT_FOUND,
                )
            if game.players.count() >= 2 and request.user not in game.players.all():
                game_request.delete()
                return Response({"detail": "Game is full"}, status=status.HTTP_403_FORBIDDEN)
            game.players.add(request.user)
            game_request.delete()
            return Response({"detail": "Successfully joined the game"}, status=status.HTTP_200_OK)
        except GameInviteRequest.DoesNotExist:
            return Response(
                {"error": "Game invite request does not exist"},
                status=status.HTTP_404_NOT_FOUND,
            )
    elif request.method == "DELETE":
        try:
            game_request = GameInviteRequest.objects.get(
                from_user=User.objects.get(nickname=nickname), to_user=request.user, game_id=game_id
            )
            game_request.delete()
            return Response({"detail": "Game invite request deleted successfully"}, status=status.HTTP_200_OK)
        except GameInviteRequest.DoesNotExist:
            return Response(
                {"error": "Game invite request does not exist"},
                status=status.HTTP_404_NOT_FOUND,
            )

@api_view(["POST"])
@permission_classes((IsAuthenticated,))
@authentication_classes((JWTAuthentication,))
def update_game_result(request):
    game_id = request.data.get('game_id')
    winner_nickname = request.data.get('winner_nickname')
    loser_nickname = request.data.get('loser_nickname')
    loser_score = request.data.get('loser_score')

    if not game_id or not winner_nickname or not loser_nickname or not loser_score:
        return Response({"error": "Missing required fields"}, status=status.HTTP_400_BAD_REQUEST)

    try:
        # Get the game object
        game = Game.objects.get(id=game_id)
    except Game.DoesNotExist:
        return Response({"error": "Game not found"}, status=status.HTTP_404_NOT_FOUND)

    # Get the players involved in the game
    players = game.players.all()

    # Check if winner and loser are among the players in the game
    winner_found = False
    loser_found = False
    for player in players:
        if player.nickname == winner_nickname:
            winner_found = True
        elif player.nickname == loser_nickname:
            loser_found = True

    if not winner_found:
        return Response({"error": "Winner nickname does not match any player in the game"}, status=status.HTTP_404_NOT_FOUND)
    if not loser_found:
        return Response({"error": "Loser nickname does not match any player in the game"}, status=status.HTTP_404_NOT_FOUND)

    # Find winner and loser objects
    try:
        winner = User.objects.get(nickname=winner_nickname)
    except User.DoesNotExist:
        return Response({"error": "Winner not found"}, status=status.HTTP_404_NOT_FOUND)

    try:
        loser = User.objects.get(nickname=loser_nickname)
    except User.DoesNotExist:
        return Response({"error": "Loser not found"}, status=status.HTTP_404_NOT_FOUND)

    # Adjust win rate for winner and loser
    adjust_win_rate(winner, loser)
    
    # Create game record for winner and loser
    winner_record = GameRecord.objects.create(nickname=winner.nickname, opponent=loser.nickname, user_score=3, opponent_score=loser_score, result="승")
    loser_record = GameRecord.objects.create(nickname=loser.nickname, opponent=winner.nickname, user_score=loser_score, opponent_score=3, result="패")
    
    # Add game records to the user's game history
    winner.game_history.add(winner_record)
    loser.game_history.add(loser_record)

    game.delete()

    return JsonResponse({"winnerNickname": winner.nickname, "loserNickname": loser.nickname, "winnerScore": 3, "loserScore": loser_score}, status=status.HTTP_200_OK)

def adjust_win_rate(winner, loser):
    winner.wins += 1
    winner.total_games += 1
    winner.win_rate = (winner.wins / winner.total_games) * 100
    winner.save()

    loser.losses += 1
    loser.total_games += 1
    loser.win_rate = (loser.wins / loser.total_games) * 100
    loser.save()

def remove_player(game, player):
    game.players.remove(player)
    if game.players.count() == 0:
        game.delete()
    else:
        if game.creator == player:
            game.creator = game.players.all()[0]
            game.save()