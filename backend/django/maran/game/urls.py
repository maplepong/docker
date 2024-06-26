from django.urls import path

from . import views

app_name = "game"

urlpatterns = [
    path("get_game_list", views.get_game_list),
    path("new/", views.new, name="new"),
    path("enter/<int:game_id>/", views.enter, name="enter"),
    path("start/<int:game_id>/", views.start, name="start"),
    path("exit/<int:game_id>/", views.exit, name="leave_game"),
    path("invite/<int:game_id>/<str:nickname>/", views.invite, name="invite"),
    path("game_invite_list", views.game_invite_list),
    path("game_request/<int:game_id>/<str:nickname>/", views.game_request),
    path("update_game_result/<int:game_id>/<str:winner_nickname>/<str:loser_nickname>/", views.update_game_result),
]
