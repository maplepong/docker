from django.conf import settings
import boto3
import uuid
from django.shortcuts import render, get_object_or_404, redirect
from django.middleware.csrf import get_token
from django.views.decorators.csrf import csrf_exempt
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
from django.contrib.auth import get_user_model
from django.contrib.auth import login as auth_login
from django.contrib.auth import authenticate
from django.contrib.auth import update_session_auth_hash
from django.contrib.auth.decorators import login_required
from django.contrib.auth import logout as auth_logout
from rest_framework.permissions import AllowAny
from decouple import config
import json
from .auth import CustomTokenObtainPairSerializer
from rest_framework.permissions import IsAuthenticated
from rest_framework_simplejwt.authentication import JWTAuthentication

import logging
import hashlib

# AWS S3 관련 설정 가져오기
AWS_ACCESS_KEY_ID = settings.AWS_ACCESS_KEY_ID
AWS_SECRET_ACCESS_KEY = settings.AWS_SECRET_ACCESS_KEY
AWS_STORAGE_BUCKET_NAME = settings.AWS_STORAGE_BUCKET_NAME

def get_s3_client():
	return boto3.client(
		"s3",
		aws_access_key_id=AWS_ACCESS_KEY_ID,
		aws_secret_access_key=AWS_SECRET_ACCESS_KEY,
	)

def get_image_url(image):
	return f"https://{AWS_STORAGE_BUCKET_NAME}.s3.ap-northeast-2.amazonaws.com/images/{image}"

def get_image(client, user, method):
    if client is None:
        client = get_s3_client()
    bucket_name = AWS_STORAGE_BUCKET_NAME
    object_key = "images/" + user.image  # 수정된 부분: 들여쓰기 정정
    try:
        response = client.get_object(Bucket=bucket_name, Key=object_key)
        image_data = (
            "https://"
            + bucket_name
            + ".s3.ap-northeast-2.amazonaws.com/"
            + object_key
        )
    except Exception as e:
        return Response({"error": str(e)}, status=500)
    if method == "GET":
        return Response({"id": user.id, "image": image_data}, status=200)
    return Response({"id": user.id, "image": image_data}, status=201)

@api_view(["GET", "POST", "DELETE"])
@permission_classes((IsAuthenticated, ))
@authentication_classes((JWTAuthentication,))
def image(request):
	user = request.user
	s3 = get_s3_client()
	if request.method == "DELETE":
		image_filename = user.image
		# S3 버킷에서 이미지 삭제
		if image_filename != "default.png":
			try:
				s3.delete_object(
					Bucket=AWS_STORAGE_BUCKET_NAME, Key=f"images/{image_filename}"
				)
			except Exception as e:
				return Response({"error": str(e)}, status=500)
		else:
			return Response({"error": "No image to delete"}, status=400)
		user.image = "default.png"
		user.save()
		return Response({"message": "Image deleted successfully"}, status=200)
	if request.method == "POST":
		file = request.FILES.get("image")
		if file:
			if upload_to_s3(s3, user, file):
				user.save()
			else:
				return Response({"error": "Failed to upload image"}, status=500)
		else:
			return Response({"error": "Invalid credentials"}, status=400)
	return get_image(s3, user, request.method)

def upload_to_s3(client, user, file_object):
    try:
        file_name = str(uuid.uuid4()) + file_object.name[file_object.name.rfind(".") :]
        response = client.upload_fileobj(file_object, AWS_STORAGE_BUCKET_NAME, "images/" + file_name)
        user.image = file_name
        return True
    except Exception as e:
        return False
