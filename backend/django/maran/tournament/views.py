from django.shortcuts import render, redirect
from django.http import HttpResponse, JsonResponse
from .models import Tournament, TournamentInviteRequest
from user.models import User
from game.models import Game
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from rest_framework_simplejwt.authentication import JWTAuthentication
from rest_framework.decorators import (
    api_view,
    permission_classes,
    authentication_classes,
)
from django.db import transaction
import random

@api_view(["POST"])
@permission_classes((IsAuthenticated,))
@authentication_classes((JWTAuthentication,))
def new_tournament(request):
    user = request.user
    
    # Tournament 테이블에 데이터가 존재하는지 확인
    if Tournament.objects.exists():
        tournament = Tournament.objects.first()
        if tournament.participants.count() >= 4:
            return JsonResponse({'error': 'Tournament room is full.'}, status=status.HTTP_400_BAD_REQUEST)
        if tournament.participants.filter(id=user.id).exists():
            return JsonResponse({'error': 'Already in tournament room.'}, status=status.HTTP_409_CONFLICT)
        # 유저를 방에 추가
        tournament.participants.add(user)

        participants = list(tournament.participants.values('id', 'nickname'))
        return JsonResponse({'message': 'Enter tournament room.', 'participants': participants}, status=status.HTTP_200_OK)
    else:
        # 새로운 토너먼트 방 생성
        tournament = Tournament.objects.create(host=user)
        tournament.participants.add(user)
        return JsonResponse({'message': 'Tournament room create and join.'}, status=status.HTTP_201_CREATED)
    
@api_view(["POST"])
@permission_classes((IsAuthenticated,))
@authentication_classes((JWTAuthentication,))
def invite_tournament(request):
    nickname = request.data.get("nickname")
    if not Tournament.objects.exists():
        return JsonResponse({'error': 'Tournament room is not exist.'}, status=status.HTTP_404_NOT_FOUND)
    tournament = Tournament.objects.first()
    if request.method == "POST":
        try:
            to_user = User.objects.get(nickname=nickname)
        except User.DoesNotExist:   #초대하는 유저가 존재하지 않을 경우
            return JsonResponse({"error": "user is not found"}, status = status.HTTP_404_NOT_FOUND)
        if to_user in tournament.participants.all():
            return JsonResponse({"error": "User is already in the tournament room"}, status=status.HTTP_400_BAD_REQUEST)
        # if tournament.participants.count() == 4:   #이미 토너먼트 방에 4명이 가득 차있을경우
            # return JsonResponse({"error": "Tournament room is full"}, status=status.HTTP_403_FORBIDDEN)
        if to_user == request.user:     #초대한 유저가 본인일 경우
            return JsonResponse({"error": "to_user is request user"}, status=status.HTTP_400_BAD_REQUEST)
        try:
            existing_request =TournamentInviteRequest.objects.get(from_user=request.user, to_user=to_user)
            existing_request.delete()  # 이미 보낸 초대가 있으면 삭제
        except TournamentInviteRequest.DoesNotExist:
            pass
        TournamentInviteRequest.objects.create(from_user=request.user, to_user=to_user)
        return JsonResponse({"message": "Successfully invited"}, status=status.HTTP_200_OK)
    return JsonResponse({"error": "something is wrong"}, status=status.HTTP_400_BAD_REQUEST)

@api_view(["POST", "DELETE"])
@permission_classes((IsAuthenticated,))
@authentication_classes((JWTAuthentication,))
def handle_invite(request):
    request_nickname = User.objects.get(nickname=request.data.get("nickname"))
    user = request.user
    if request.method == "POST":
        try:
            from_user = User.objects.get(nickname=request_nickname)
            tournament_request= TournamentInviteRequest.objects.get(
                from_user=from_user, to_user=request.user
            )
            try:
                tournament = Tournament.objects.first()
            except Tournament.DoesNotExist:
                tournament_request.delete()
                return JsonResponse({"error": "Tournament does not exist"}, status=status.HTTP_404_NOT_FOUND)
            if tournament.participants.count() >= 4 and request.user not in tournament.participants.all():
                tournament_request.delete()
                return JsonResponse({"error": "Tournament is full"}, status=status.HTTP_403_FORBIDDEN)
            tournament.participants.add(request.user)
            tournament_request.delete()
            return JsonResponse({"detail": "Successfully joined the tournament"}, status=status.HTTP_200_OK)
        except TournamentInviteRequest.DoesNotExist:
            return JsonResponse(
                {"error": "Tournament invite request does not exist"},
                status=status.HTTP_404_NOT_FOUND,
            )
    elif request.method == "DELETE":
        try:
            from_user = User.objects.get(nickname=request_nickname)
            tournament_request= TournamentInviteRequest.objects.get(
                from_user=from_user, to_user=request.user
            )
            tournament_request.delete()
            return JsonResponse({"detail": "Tournament invite request deleted successfully"}, status=status.HTTP_200_OK)
        except TournamentInviteRequest.DoesNotExist:
            return JsonResponse(
                {"error": "Tournament invite request does not exist"},
                status=status.HTTP_404_NOT_FOUND,
            )

@api_view(["GET"])
@permission_classes((IsAuthenticated,))
@authentication_classes((JWTAuthentication,))
def tournament_invite_list(request):
    if request.method == "GET":
        sends_requests = TournamentInviteRequest.objects.filter(from_user=request.user)
        receives_requests = TournamentInviteRequest.objects.filter(to_user=request.user)
        
        if not sends_requests and not receives_requests:
            return JsonResponse({'error': 'User does not have any invite'}, status=status.HTTP_204_NO_CONTENT)
        
        sends = [
            {
                "from_user": tournament_request.from_user.nickname,
                "to_user": tournament_request.to_user.nickname,
            }
            for tournament_request in sends_requests
        ]
        receives = [
            {
                "from_user": tournament_request.from_user.nickname,
                "to_user": tournament_request.to_user.nickname,
            }
            for tournament_request in receives_requests
        ]

        data = {
            "sends": sends,
            "receives": receives,
        }
        return JsonResponse(data, status=status.HTTP_200_OK)

@api_view(["POST"])
@permission_classes((IsAuthenticated,))
@authentication_classes((JWTAuthentication,))
def start_semifinal(request):
    user = request.user

    # Tournament 테이블에 데이터가 존재하는지 확인
    if not Tournament.objects.exists():
        return JsonResponse({'error': 'Tournament room is not exist.'}, status=status.HTTP_404_NOT_FOUND)

    tournament = Tournament.objects.first()
    
    # 게임 시작 권한 확인
    if tournament.host != user:
        return JsonResponse({'error': "Don't have a permission to game start."}, status=status.HTTP_403_FORBIDDEN)

    # 참가자가 4명이 아닌 경우
    if tournament.participants.count() != 4:
        return JsonResponse({'error': 'You need 4 users to start tournament.'}, status=status.HTTP_400_BAD_REQUEST)

    # 토너먼트 진행 중 여부 확인
    if tournament.is_active:
        return JsonResponse({'error': 'Tournament is already in progress.'}, status=status.HTTP_400_BAD_REQUEST)
    
    participants = list(tournament.participants.all())
    random.shuffle(participants)
    tournament.participants.clear() #새 대진표대로 유저 목록 다시 배치
    for participant in participants:
        tournament.participants.add(participant)  # 랜덤하게 섞은 참가자들 추가
    matches = [(participants[0], participants[1]), (participants[2], participants[3])]

    # 토너먼트 시작
    tournament.is_active = True

    with transaction.atomic():
        # 첫 번째 세미파이널 게임 생성 및 저장
        semifinal1 = Game.objects.create(name="semifinal1", creator=participants[0], status=0)
        semifinal1.players.add(participants[0], participants[1])
        tournament.semifinal_game1 = semifinal1

        # 두 번째 세미파이널 게임 생성 및 저장
        semifinal2 = Game.objects.create(name="semifinal2", creator=participants[2], status=0)
        semifinal2.players.add(participants[2], participants[3])
        tournament.semifinal_game2 = semifinal2

        tournament.save()
    return JsonResponse({'message': 'semifinal started successfully'}, status=status.HTTP_200_OK)

@api_view(["GET"])
@permission_classes((IsAuthenticated,))
@authentication_classes((JWTAuthentication,))
def get_bracket(request):
    if not Tournament.objects.exists():
        return JsonResponse({'error': 'Tournament room is not exist.'}, status=status.HTTP_404_NOT_FOUND)
    tournament = Tournament.objects.first()
    if tournament.is_active != True:
        return JsonResponse({'error': 'Tournament are not started yet.'}, status=status.HTTP_400_BAD_REQUEST)
    # if tournament.participants.count() != 4:
        # return JsonResponse({'error': 'Less than 4 participants'}, status=status.HTTP_400_BAD_REQUEST)
    nickname_lst = []
    participants = tournament.get_participants()
    for participant in participants:
        nickname_lst.append(participant.nickname)
    
    response_data = {
        "message": "Get bracket successfully",
        "nicknames": nickname_lst
    }
    return JsonResponse(response_data, status=status.HTTP_200_OK)

@api_view(["DELETE"])
@permission_classes((IsAuthenticated,))
@authentication_classes((JWTAuthentication,))
def out_tournament(request):
    user = request.user
    
    # Tournament 테이블에 데이터가 존재하는지 확인
    if not Tournament.objects.exists():
        return JsonResponse({'error': 'Tournament room is not exist.'}, status=status.HTTP_404_NOT_FOUND)

    tournament = Tournament.objects.first()

    # 토너먼트 진행 중인지 확인
    # if tournament.is_active:
        # return JsonResponse({'error': 'Tournament is in progress. Cannot go out'}, status=status.HTTP_400_BAD_REQUEST)
    
    # 유저가 방에 참가하고 있는지 확인
    if not tournament.participants.filter(id=user.id).exists():
        return JsonResponse({'error': 'Not in tournament room.'}, status=status.HTTP_400_BAD_REQUEST)

    # 방에서 유저 제거
    tournament.participants.remove(user)

    # 만약 방에서 나간 사용자가 방장이었다면, 방장은 다음 참가자로 변경
    if tournament.host == user:
        remaining_participants = tournament.participants.all()
        if remaining_participants.exists():
            tournament.host = remaining_participants.first()
        else:
            tournament.delete()
            return JsonResponse({'message': '토너먼트 방이 삭제되었습니다.'}, status=status.HTTP_200_OK)
    
    tournament.save()

    return JsonResponse({'message': 'Out of tournament room'}, status=status.HTTP_200_OK)

# 예시로 상세보기 뷰를 작성합니다.
def tournament_detail(request, tournament_id):
    try:
        tournament = Tournament.objects.get(id=tournament_id)
    except Tournament.DoesNotExist:
        return HttpResponse("Tournament not found.", status=404)
    
    return render(request, 'tournament/tournament_detail.html', {'tournament': tournament})
