from rest_framework.response import Response
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
from .models import User
from requests import Request


@api_view(["GET"])
@permission_classes([AllowAny])
def duplicate_check(request):
    type = request.GET.get("type")
    value = request.GET.get("value")

    if type == "username":
        user = User.objects.filter(username=value)
    elif type == "nickname":
        user = User.objects.filter(nickname=value)
    elif type == "email":
        user = User.objects.filter(email=value)
    else:
        return Response({"error": "Invalid type"}, status=400)

    if user.exists():
        return Response({"error": "Conflict"}, status=409)
    return Response(status=200)
