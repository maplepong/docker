from django.contrib.auth.models import AbstractUser
from django.core.validators import MinLengthValidator
from django.db import models

class User(AbstractUser):
    id = models.IntegerField(primary_key=True, editable=False)
    username = models.CharField(max_length=30, unique=True)
    nickname = models.CharField(max_length=30, unique=True)
    email = models.EmailField(unique=True)
    password = models.CharField(
        max_length=1000,
        validators=[
            MinLengthValidator(
                limit_value=8, message="비밀번호는 최소 8자 이상이어야 합니다."
            )
        ],
    )
    introduction = models.CharField(max_length=100)
    type = models.IntegerField()  # 0: 일반회원, 1: api
    image = models.CharField(max_length=100, default="default.png")
    friends = models.ManyToManyField("self", symmetrical=True)
    blocked_users = models.ManyToManyField("self", symmetrical=False, blank=True)
    wins = models.PositiveIntegerField(default=0)
    losses = models.PositiveIntegerField(default=0)
    total_games = models.PositiveIntegerField(default=0)
    win_rate = models.FloatField(default=0.0)
    secret_keys = models.CharField(max_length=100, blank=True, null=True)
    is_2fa_enabled = models.BooleanField(default=False)
    last_2fa_time = models.DateTimeField(null=True, blank=True)

    # 접속 상태 필드 추가
    is_online = models.BooleanField(default=False)
    last_online = models.DateTimeField(null=True, blank=True)

    def __str__(self):
        return self.username

    def serialize(self):
        from .image import get_image_url
        return {
            "id": self.id,
            "username": self.username,
            "nickname": self.nickname,
            "email": self.email,
            "introduction": self.introduction,
            "image": get_image_url(self.image),
            "wins": self.wins,
            "losses": self.losses,
            "total_games": self.total_games,
            "win_rate": self.win_rate,
            "is_online": self.is_online,  # 접속 상태 추가
            "last_online": self.last_online,  # 마지막 접속 시간 추가
        }

    @classmethod
    def get_queryset(cls):
        return cls.objects.all()

class FriendRequest(models.Model):
    from_user = models.ForeignKey(
        User, related_name="friend_requests_sent", on_delete=models.CASCADE
    )
    to_user = models.ForeignKey(
        User, related_name="friend_requests_received", on_delete=models.CASCADE
    )
    created_at = models.DateTimeField(auto_now_add=True)
    accepted = models.BooleanField(default=False)
