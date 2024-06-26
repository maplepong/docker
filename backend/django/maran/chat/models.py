from django.db import models
from django.conf import settings

class Message(models.Model):
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='messages')
    recipient = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='whispers', null=True, blank=True)
    content = models.TextField()
    timestamp = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        if self.recipient:
            return f'{self.user.username} to {self.recipient.username}: {self.content}'
        return f'{self.user.username}: {self.content}'