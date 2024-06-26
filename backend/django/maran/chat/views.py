from rest_framework import viewsets
from rest_framework.permissions import IsAuthenticated
from .models import Message
from .serializers import MessageSerializer
from rest_framework_simplejwt.authentication import JWTAuthentication
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status

class MessageViewSet(viewsets.ModelViewSet):
    queryset = Message.objects.all()
    serializer_class = MessageSerializer
    permission_classes = [IsAuthenticated]
    authentication_classes = [JWTAuthentication]