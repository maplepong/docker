from django.urls import path

from . import views

app_name = "tournament"

urlpatterns = [
    path('new_tournament', views.new_tournament, name='new_tournament'),
    path('invite_tournament', views.invite_tournament, name='invite_tournament'),
    path('handle_invite', views.handle_invite, name='handle_invite'),
    path('tournament_invite_list', views.tournament_invite_list, name='tournament_invite_list'),
    path('start_semifinal', views.start_semifinal, name='start_semifinal'),
    path('get_bracket', views.get_bracket, name="get_bracket"),
    path('end_semifinal', views.end_semifinal, name='end_semifinal'),
    path('out_tournament', views.out_tournament, name='out_tournament'),
    path('end_tournament', views.end_tournament, name='end_tournament'),
]
