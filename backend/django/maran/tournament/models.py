from django.db import models
from user.models import User
from game.models import Game

class Tournament(models.Model):
    max_participants = models.PositiveIntegerField(default=4)
    participants = models.ManyToManyField(User, related_name='tournaments')
    created_at = models.DateTimeField(auto_now_add=True)
    host = models.ForeignKey(User, related_name='hosted_tournaments', on_delete=models.CASCADE, null=True, blank=True)
    is_active = models.BooleanField(default=False)  # 토너먼트 진행 여부 확인 필드
    semifinal_game1 = models.ForeignKey(Game, related_name="semifinal_1", on_delete=models.CASCADE, null=True, blank=True)
    semifinal_game2 = models.ForeignKey(Game, related_name="semifinal_2", on_delete=models.CASCADE, null=True, blank=True)
    final_game_id = models.ForeignKey(Game, related_name="final", on_delete=models.CASCADE, null=True, blank=True)
    end_game_count = models.PositiveBigIntegerField(default=0)
    
    def get_participants(self):
        return self.participants.all()

class TournamentInviteRequest(models.Model):
    from_user = models.ForeignKey(
        User, related_name="tournament_invite_sent", on_delete=models.CASCADE
    )
    to_user = models.ForeignKey(
        User, related_name="tournament_invite_received", on_delete=models.CASCADE
    )
    created_at = models.DateTimeField(auto_now_add=True)
    accepted = models.BooleanField(default=False)