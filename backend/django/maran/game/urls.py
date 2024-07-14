from django.urls import path

from . import views

app_name = "game"

urlpatterns = [
    path("", views.index, name="index"),
    path("get_game_list", views.get_game_list),
    path("new", views.new, name="new"),
    path("game_info/<int:game_id>", views.game_info, name="game_info"),
    path("enter", views.enter, name="enter"),
    path("start/<int:game_id>", views.start, name="start"),
    path("exit/<int:game_id>", views.exit, name="leave_game"),
    path("invite", views.invite, name="invite"),
    path("invite-list", views.game_invite_list),
    path("react-invite", views.game_request),
    path("update_game_result", views.update_game_result),
]
