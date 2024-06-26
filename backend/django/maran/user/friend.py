from django.http import HttpResponse
from rest_framework.response import Response
from django.db.models import Q
from rest_framework.decorators import (
    api_view,
    permission_classes,
    authentication_classes,
)
from rest_framework import status
from .models import User, FriendRequest
from requests import Request
from django.contrib.auth import authenticate
from rest_framework.permissions import AllowAny
from decouple import config
import json
from .auth import CustomTokenObtainPairSerializer
from rest_framework.permissions import IsAuthenticated
from rest_framework_simplejwt.authentication import JWTAuthentication
import logging
import hashlib


@api_view(["GET"])
@permission_classes((IsAuthenticated,))
@authentication_classes((JWTAuthentication,))
def friend_list(request):
    friends = request.user.friends.all()
    if not friends:
        return Response(status=status.HTTP_204_NO_CONTENT)
    serialized_friends = [
        {"id": friend.id, "nickname": friend.nickname} for friend in friends
    ]
    return Response(serialized_friends, status=status.HTTP_200_OK)


@api_view(["POST", "DELETE"])
@permission_classes((IsAuthenticated,))
@authentication_classes((JWTAuthentication,))
def friend(request, nickname):
    if request.method == "POST":
        try:
            to_user = User.objects.get(nickname=nickname)
        except User.DoesNotExist:
            return Response(
                {"error": "user is not found"}, status=status.HTTP_404_NOT_FOUND
            )
        if to_user == request.user:
            return Response(
                {"error": "to_user is request user"}, status=status.HTTP_400_BAD_REQUEST
            )
        if FriendRequest.objects.filter(
            from_user=request.user, to_user=to_user
        ).exists():
            return Response(
                {"error": "already exists"}, status=status.HTTP_409_CONFLICT
            )
        FriendRequest.objects.create(from_user=request.user, to_user=to_user)
        return Response(
            {"from_user": request.user.nickname, "to_user": to_user.nickname},
            status=status.HTTP_201_CREATED,
        )
    elif request.method == "DELETE":
        try:
            to_user = User.objects.get(nickname=nickname)
            if to_user not in request.user.friends.all():
                return Response(status=status.HTTP_400_BAD_REQUEST)
            request.user.friends.remove(to_user)
            return Response(status=status.HTTP_200_OK)
        except User.DoesNotExist:
            return Response(
                {"error": "user is not found"}, status=status.HTTP_404_NOT_FOUND
            )
    return Response({"error": "something is wrong"}, status=status.HTTP_400_BAD_REQUEST)


@api_view(["GET"])
@permission_classes((IsAuthenticated,))
@authentication_classes((JWTAuthentication,))
def friend_request_list(request):
    if request.method == "GET":
        sends_requests = FriendRequest.objects.filter(from_user=request.user)
        receives_requests = FriendRequest.objects.filter(to_user=request.user)

        if not sends_requests and not receives_requests:
            return Response(status=status.HTTP_204_NO_CONTENT)

        sends = [
            {
                "from_user": friend_request.from_user.nickname,
                "to_user": friend_request.to_user.nickname,
            }
            for friend_request in sends_requests
        ]
        receives = [
            {
                "from_user": friend_request.from_user.nickname,
                "to_user": friend_request.to_user.nickname,
            }
            for friend_request in receives_requests
        ]

        data = {
            "sends": sends,
            "receives": receives,
        }
        return Response(
            data,
            status=status.HTTP_200_OK,
        )


@api_view(["POST", "DELETE"])
@permission_classes((IsAuthenticated,))
@authentication_classes((JWTAuthentication,))
def friend_request(request, nickname):
    if request.method == "POST":
        # 내가 친구 요청을 수락함
        try:
            from_user = User.objects.get(nickname=nickname)
            friend_request = FriendRequest.objects.get(
                from_user=from_user, to_user=request.user
            )
            if friend_request.to_user != request.user:
                return Response(
                    {"error": "user not recieved request"},
                    status=status.HTTP_400_BAD_REQUEST,
                )
            if from_user in request.user.friends.all():
                return Response(
                    {"error": "already friend"}, status=status.HTTP_409_CONFLICT
                )
            request.user.friends.add(from_user)
            friend_request.delete()
            return Response(
                data={"me": request.user.nickname, "friend": from_user.nickname},
                status=status.HTTP_201_CREATED,
            )
        except User.DoesNotExist:
            return Response(
                {"error": "user not found"}, status=status.HTTP_404_NOT_FOUND
            )
        except FriendRequest.DoesNotExist:
            return Response(
                {"error": "request not found"}, status=status.HTTP_404_NOT_FOUND
            )

    elif request.method == "DELETE":
        # 내가 친구 요청을 취소 혹은 거절함
        try:
            opponent = User.objects.get(nickname=nickname)
            friend_request = FriendRequest.objects.get(from_user=opponent)
        except User.DoesNotExist:
            return Response(
                {"error": "user not found"}, status=status.HTTP_404_NOT_FOUND
            )
        except FriendRequest.DoesNotExist:
            try:
                friend_request = FriendRequest.objects.get(to_user=opponent)
            except FriendRequest.DoesNotExist:
                return Response(status=status.HTTP_404_NOT_FOUND)
        friend_request.delete()
        return Response(status=status.HTTP_200_OK)
    return Response(
        {"error": "something is wrong"}, statusstatus=status.HTTP_400_BAD_REQUEST
    )
