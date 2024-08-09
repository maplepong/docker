from django.db import models
from user.models import User


class Game(models.Model):
    id = models.AutoField(primary_key=True, editable=False)
    name = models.CharField(unique=True, max_length=30)
    creator = models.ForeignKey(
        User, related_name="games_created", on_delete=models.CASCADE, null=True, blank=True
    )
    players = models.ManyToManyField(User, related_name="games_joined")
    password = models.CharField(max_length=30, blank=True, null=True)
    status = models.IntegerField(default=0)  # 0: 대기중, 1: 진행중

    def __str__(self):
        return self.name


class GameInfo:
    def __init__(self, id, name, current_players_num, players, owner, password, status):
        self.id = id
        self.name = name
        self.current_players_num = current_players_num
        self.players = players
        self.owner = owner
        self.password = password
        self.status = status

class GameInviteRequest(models.Model):
    from_user = models.ForeignKey(
        User, related_name="game_invite_sent", on_delete=models.CASCADE
    )
    to_user = models.ForeignKey(
        User, related_name="game_invite_received", on_delete=models.CASCADE
    )
    game_id = models.IntegerField(null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    accepted = models.BooleanField(default=False)