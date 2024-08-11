from django.shortcuts import render, redirect
from django.http import HttpResponse
from rest_framework.response import Response
from rest_framework.decorators import api_view, permission_classes
from rest_framework.views import APIView
from rest_framework import status
from .models import User
from django.http import JsonResponse, HttpResponseRedirect
from requests.auth import HTTPBasicAuth
from django.contrib.auth import get_user_model
from django.contrib.auth import login as auth_login
from django.contrib.auth import authenticate
from django.contrib.auth import update_session_auth_hash
from django.contrib.auth.decorators import login_required
from django.contrib.auth import logout as auth_logout
from rest_framework.permissions import AllowAny
from decouple import config
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from rest_framework_simplejwt.views import TokenObtainPairView
from rest_framework.authentication import BaseAuthentication
from rest_framework.exceptions import AuthenticationFailed
from rest_framework_simplejwt.authentication import JWTAuthentication
from rest_framework_simplejwt.tokens import AccessToken
import logging
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework_simplejwt.exceptions import TokenError
import json
import requests
from django.conf import settings


logger = logging.getLogger("django")


@api_view(["POST"])
@permission_classes([AllowAny])
def api_signup(request):
    id = request.data.get("id")
    nickname = request.data.get("nickname")

    if User.objects.filter(id=id).exists():
        return Response("User already exists", status=409)

    if id is None or nickname is None:
        return Response("No id or nickname", status=400)

    try:
        user = User.objects.create(
            id=id,
            username=id,
            nickname=nickname,
            type=1,
            introduction="42 api user",
            email="api" + id + "@seoul.kr"
        )
        user.set_unusable_password()
        user.save()
        return Response("User created", status=201)
    except Exception as e:
        return Response(str(e), status=500)


@api_view(["POST"])
@permission_classes([AllowAny])
def api_login(request):
    code = request.data.get("code")
    if code is None:
        return Response("No api code", status=400)
    token_params = {
        "client_id": settings.CLIENT_ID,
        "client_secret": settings.CLIENT_SECRET,
        "code": code,
        "redirect_uri": "https://localhost:443/api-login",
        "grant_type": "authorization_code",
    }
    print(code)
    logger.info(f"Sending token request to {settings.TOKEN_URL} with {token_params}")

    print(code)

    token_response = requests.post(settings.TOKEN_URL, data=token_params)
    # 응답 받은 후 로깅
    logger.info(f"Token response: {token_response.status_code} {token_response.text}")
    print(token_response)

    if token_response.status_code == 200:
        access_token = token_response.json().get("access_token")
        user_info_response = requests.get(
            "https://api.intra.42.fr/v2/me",
            headers={"Authorization": f"Bearer {access_token}"},
        )
        if user_info_response.status_code == 200:
            user_info = user_info_response.json()
            try:
                user = User.objects.get(id=user_info["id"])
                serializer = CustomTokenObtainPairSerializer()
                token = serializer.get_token(user)
                access_token = {
                    "access_token": str(token.access_token),
                    "username": user.username,
                    "nickname": user.nickname,
                }
                response = JsonResponse(access_token)
                response.set_cookie(
                    "refresh_token", str(token), httponly=True, samesite="None"
                )
                return response
            except User.DoesNotExist:
                return Response(
                    {"id": user_info["id"]}, status=202
                )
        else:
            return Response(
                "api login failed (user_info)", status=user_info_response.status_code
            )
    else:
        return Response("api login failed(api post)", status=token_response.status_code)


class CustomTokenObtainPairSerializer(TokenObtainPairSerializer):
    @classmethod
    def get_token(cls, user):
        token = super().get_token(user)
        # Add custom claims
        token["username"] = user.username
        token["nickname"] = user.nickname
        return token


class MyTokenObtainPairView(TokenObtainPairView):
    serializer_class = CustomTokenObtainPairSerializer


from rest_framework_simplejwt.authentication import JWTTokenUserAuthentication


class BaseView(APIView):
    permission_classes = [AllowAny]
    # def is_admin_check(self, request):
    #     if request.user.is_staff:
    #         return True
    #     return False
    pass


class TokenRefreshView(BaseView):
    def post(self, request):
        # response = self.is_admin_check(request)
        # if response:
        #     return Response({'error': 'You are not an admin'}, status=400)
        refresh_token = request.COOKIES.get("refresh_token")
        print("cookie: ", request.COOKIES)
        print("refresh_token : ", refresh_token)
        if not refresh_token:
            return Response({"error": "No refresh token provided"}, status=400)

        try:
            refresh_token = RefreshToken(refresh_token)
            access_token = str(refresh_token.access_token)
            return Response({"access_token": access_token}, status=200)
        except TokenError as e:
            return Response({"error": str(e)}, status=401)


# class MyCustomJWTAuthentication(JWTAuthentication):
#     def authenticate(self, request):
#         # 토큰 추출
#         header = self.get_header(request)
#         if header is None:
#             return None

#         # 토큰 검증
#         try:
#             validated_token = self.get_validated_token(header)
#         except AuthenticationFailed:
#             raise

#         # 만료된 토큰인지 확인
#         if isinstance(validated_token, AccessToken) and validated_token.is_expired:
#             raise AuthenticationFailed("Token expired")

#         # 토큰의 유저 반환
#         return self.get_user(validated_token), validated_token
