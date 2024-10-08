# Generated by Django 4.2.11 on 2024-07-22 06:42

from django.conf import settings
from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    initial = True

    dependencies = [
        ('game', '0002_initial'),
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
    ]

    operations = [
        migrations.CreateModel(
            name='TournamentInviteRequest',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('accepted', models.BooleanField(default=False)),
                ('from_user', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='tournament_invite_sent', to=settings.AUTH_USER_MODEL)),
                ('to_user', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='tournament_invite_received', to=settings.AUTH_USER_MODEL)),
            ],
        ),
        migrations.CreateModel(
            name='Tournament',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('max_participants', models.PositiveIntegerField(default=4)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('is_active', models.BooleanField(default=False)),
                ('final_game_id', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='final', to='game.game')),
                ('host', models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.CASCADE, related_name='hosted_tournaments', to=settings.AUTH_USER_MODEL)),
                ('participants', models.ManyToManyField(related_name='tournaments', to=settings.AUTH_USER_MODEL)),
                ('semifinal_game1', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='semifinal_1', to='game.game')),
                ('semifinal_game2', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='semifinal_2', to='game.game')),
            ],
        ),
    ]
