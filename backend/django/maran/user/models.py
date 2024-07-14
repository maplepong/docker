from django.contrib.auth.models import AbstractUser
from django.core.validators import MinLengthValidator
from django.db import models

class GameRecord(models.Model):
    id = models.AutoField(primary_key=True, editable=False)
    nickname = models.CharField(max_length=30)
    opponent = models.CharField(max_length=30)
    user_score = models.PositiveIntegerField()
    opponent_score = models.PositiveIntegerField()
    result = models.CharField(max_length=10)  # "승","패"
    game_date = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.opponent}과의 게임에서 {self.user_score}:{self.opponent_score} {self.result}"

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

    # 게임 관련 필드 추가
    game_history = models.ManyToManyField(GameRecord, related_name='players', blank=True)

    # 접속 상태 필드 추가
    is_online = models.BooleanField(default=False)
    last_online = models.DateTimeField(null=True, blank=True)

    def get_match_history(self):
        # 사용자의 최근 6개의 매치 기록을 가져옵니다.
        recent_matches = self.game_history.order_by('-game_date')[:6]

        # 매치 기록을 serialize하여 반환합니다.
        match_history = []
        for match in recent_matches:
            match_info = {
                'nickname': match.nickname,
                'opponent': match.opponent,
                'user_score': match.user_score,
                'opponent_score': match.opponent_score,
                'result': match.result,
                'game_date': match.game_date.strftime('%Y-%m-%d %H:%M:%S')  # 날짜 형식 지정
            }
            match_history.append(match_info)

        return match_history

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
