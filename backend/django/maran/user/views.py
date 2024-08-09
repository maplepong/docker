from django.http import HttpResponse, JsonResponse
from rest_framework.response import Response
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

from django_otp.plugins.otp_totp.models import TOTPDevice
from django.contrib.auth import get_user_model
from django_otp.util import random_hex

import random
import string
import base64
import os
import pyotp
import qrcode
from io import BytesIO
from django.core.mail import EmailMessage
from django.core.files.images import ImageFile
from django.conf import settings
from django_otp.oath import TOTP
from django.contrib.auth.hashers import make_password, check_password
from django.utils import timezone
from datetime import timedelta
from django.core.mail import send_mail
from django.core.files.base import ContentFile


logger = logging.getLogger("django")

@api_view(["POST"])
@permission_classes([AllowAny])
def login(request):
    username = request.data.get("username")
    password = request.data.get("password")

    user = authenticate(request, username=username, password=password)

    if not user:
        return Response({"error": "Invalid credentials"}, status=409)

    now = timezone.now()

    if not user.is_2fa_enabled:
        secret_key = base64.b32encode(os.urandom(10)).decode()
        user.secret_keys = secret_key
        user.last_2fa_time = now
        user.save()

        totp = pyotp.TOTP(secret_key)
        otp_url = totp.provisioning_uri(name=user.username, issuer_name="user")

        qr = qrcode.QRCode(
            version=1,
            error_correction=qrcode.constants.ERROR_CORRECT_L,
            box_size=10,
            border=4,
        )
        qr.add_data(otp_url)
        qr.make(fit=True)

        buffer = BytesIO()
        img = qr.make_image(fill_color="black", back_color="white")
        img.save(buffer)
        buffer.seek(0)
        image_file = ContentFile(buffer.getvalue(), 'otp.png')

        email = EmailMessage(
            'Your OTP',
            'Please scan this QR Code with your OTP app.',
            settings.DEFAULT_FROM_EMAIL,
            [user.email]
        )
        email.attach(image_file.name, image_file.read(), 'image/png')
        email.send(fail_silently=False)

        return Response({"message": "OTP QR Code sent to your email. Please scan it to complete your login."}, status=201)

    elif now - user.last_2fa_time > timedelta(weeks=10):
        return Response({"message": "Please use your authenticator app to verify your OTP."}, status=202)

    else:
        user.last_2fa_time = now
        user.save()
        # 토큰 생성 및 응답 설정
        serializer = CustomTokenObtainPairSerializer()
        token = serializer.get_token(user)
        access_token = {"access_token": str(token.access_token), "nickname": user.nickname}
        response = HttpResponse()

        response.set_cookie("refresh_token", str(token), httponly=True, samesite="None")
        response.content = json.dumps(access_token)
        response['Content-Type'] = 'application/json'
        return response


@api_view(["POST"])
@permission_classes([AllowAny])
def otp_verify(request):
    username = request.data.get("username")
    otp_entered = request.data.get("otp")

    try:
        user = User.objects.get(username=username)
    except User.DoesNotExist:
        return Response({"error": "User not found"}, status=404)

    # 사용자에게 연결된 비밀 키 가져오기
    secret_key = user.secret_keys
    if not secret_key:
        return Response({"error": "Secret key not found"}, status=404)


    # 입력된 OTP 검증
    totp = pyotp.TOTP(secret_key)
    if totp.verify(otp_entered):
        now = timezone.now()
        # OTP 검증 성공
        user.last_2fa_time = now
        user.is_2fa_enabled = True
        user.save()

        # 토큰 생성 및 응답 설정
        serializer = CustomTokenObtainPairSerializer()
        token = serializer.get_token(user)
        access_token = {"access_token": str(token.access_token), "nickname": user.nickname}
        response = HttpResponse()

        response.set_cookie("refresh_token", str(token), httponly=True, samesite="None")
        response.content = json.dumps(access_token)
        response['Content-Type'] = 'application/json'
        return response
    else:
        # OTP 검증 실패
           return Response({"error": "Invalid OTP"}, status=400)

@api_view(["POST"])
@permission_classes([AllowAny])
def generate_email_pin(request):
    email = request.data.get("email")

    if not email:
        return Response({"error": "Email is required"}, status=400)

    pin = ''.join(random.choices(string.digits, k=6))
    # PIN을 임시로 저장 (예를 들어 캐시 또는 세션)
    request.session['pin'] = pin
    request.session['email'] = email
    request.session['pin_creation_time'] = timezone.now().isoformat()

    send_mail(
        'Your PIN Code',
        f'Your PIN code for email verification is {pin}',
        settings.DEFAULT_FROM_EMAIL,
        [email],
        fail_silently=False,
    )

    return Response({"message": "PIN code sent to your email"}, status=200)

@api_view(["POST"])
@permission_classes([AllowAny])
def verify_pin(request):
    email = request.data.get("email")
    pin_entered = request.data.get("pin")

    if not all([email, pin_entered]):
        return Response({"error": "Email and PIN are required"}, status=400)

    saved_pin = request.session.get('pin')
    saved_email = request.session.get('email')
    pin_creation_time = request.session.get('pin_creation_time')

    if not saved_pin or not saved_email or not pin_creation_time:
        return Response({"error": "PIN not found or expired"}, status=400)

    if email != saved_email:
        return Response({"error": "Email does not match"}, status=400)

    if pin_entered != saved_pin:
        return Response({"error": "Invalid PIN"}, status=400)

    pin_creation_time = timezone.datetime.fromisoformat(pin_creation_time)
    if timezone.now() - pin_creation_time > timedelta(minutes=1):
        return Response({"error": "PIN expired"}, status=400)

    return Response({"message": "PIN verified successfully"}, status=200)

@api_view(["POST"])
@permission_classes([AllowAny])
def signup(request):
    # POST 요청에서 사용자 이름과 비밀번호 가져오기
    username = request.data.get("username")
    password = request.data.get("password")
    nickname = request.data.get("nickname")

    if nickname.upper() == "SYSTEM" or nickname.upper() == "ADMIN":
        return Response({"error": "Invalid nickname"}, status=400)

    email = request.data.get("email")
    hashed_id = hashlib.sha256(username.encode()).hexdigest()

    # 사용자 생성
    user = User.objects.create_user(
        id=int(hashed_id[:8], 16) % 1000000000,
        username=username,
        password=password,
        nickname=nickname,
        email=email,
        introduction="",
        type=0,
        image="default.png",
    )

    # 사용자 생성에 실패하면 에러 응답 반환
    if not user:
        return Response({"error": "Invalid credentials"}, status=400)
    return Response(user.serialize(), status=201)

@api_view(["GET", "PATCH"])
@permission_classes((IsAuthenticated,))
@authentication_classes((JWTAuthentication,))
def userinfo(request):
    if request.method == "GET":
        nickname = request.GET.get("nickname")
        user = request.user
        if not user:
            return Response({"error": "Invalid credentials"}, status=400)
        return Response(user.serialize())
    elif request.method == "PATCH":
        nickname = request.data.get("nickname")
        introduction = request.data.get("introduction")

        if nickname is None and introduction is None:
            return Response({"error": "Invalid credentials"}, status=400)
        if nickname:
            if nickname.upper() == "SYSTEM" or nickname.upper() == "ADMIN":
                return Response({"error": "Invalid nickname"}, status=400)
            if User.objects.filter(nickname=nickname).exists():
                return Response({"error": "Conflict"}, status=409)
            request.user.nickname = nickname
        if introduction:
            request.user.introduction = introduction
        request.user.save()
        return Response(request.user.serialize(), status=201)
    else:
        return Response({"error": "Invalid request"}, status=400)


@api_view(["PUT"])
@permission_classes((IsAuthenticated,))
@authentication_classes((JWTAuthentication,))
def change_password(request):
    username = request.data.get("username")
    current_pw = request.data.get("current_password")
    new_pw = request.data.get("new_password")

    if not username or not current_pw or not new_pw:
        return Response({"error": "Invalid credentials"}, status=400)

    user = authenticate(request, username=username, password=current_pw)
    if not user:
        return Response({"error": "Unauthorized"}, status=401)
    user.set_password(new_pw)
    user.save()
    return Response(user.serialize())

@api_view(["GET"])
@permission_classes((IsAuthenticated,))
@authentication_classes((JWTAuthentication,))
def game_record(request):
    user = request.user

    # 유저의 모든 게임 기록을 최신순으로 가져옵니다.
    game_records = user.game_history.order_by('-game_date')

    # 게임 기록을 serialize 합니다.
    record_list = []
    for record in game_records:
        record_list.append({
            'opponent': record.opponent,
            'user_score': record.user_score,
            'opponent_score': record.opponent_score,
            'result': record.result,
            'game_date': record.game_date.strftime('%Y-%m-%d %H:%M:%S')
        })

    return JsonResponse({'game_records': record_list}, status=status.HTTP_200_OK)

from collections import Counter
@api_view(["GET"])
@permission_classes((IsAuthenticated,))
@authentication_classes((JWTAuthentication,))
def rival(request):
    user = request.user
    
    # 최근 20게임 가져오기
    recent_games = user.game_history.all().order_by('-id')[:20]
    
    # 게임이 없는 경우 처리
    if not recent_games:
        return JsonResponse({'detail': 'No recent games found'}, status=200)
    
    # 각 게임에서 상대방 추출
    opponents = [game.opponent for game in recent_games]
    
    # 상대방 출현 빈도 계산
    opponent_counts = Counter(opponents)
    
    # 가장 많이 게임한 상대방 찾기
    rival_nickname, games_played_together = opponent_counts.most_common(1)[0]
    
    # 라이벌 정보를 응답으로 반환
    rival_info = {
        'nickname': rival_nickname,
        'games_played_together': games_played_together
    }
    
    return JsonResponse(rival_info)