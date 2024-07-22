from django.urls import path

from . import views

app_name = "tournament"

urlpatterns = [
    path('new_tournament', views.new_tournament, name='new_tournament'),
    path('invite_tournament', views.invite_tournament, name='invite_tournament'),
    path('start_semifinal', views.start_semifinal, name='start_semifinal'),
    path('get_bracket', views.get_bracket, name="get_bracket"),
    path('out_tournament', views.out_tournament, name='out_tournament'),
]
