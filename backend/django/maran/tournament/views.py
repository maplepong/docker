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
        host = tournament.host.nickname
        return JsonResponse({'message': 'Enter tournament room.', 'participants': participants, 'host':host}, status=status.HTTP_200_OK)
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
    request_nickname = request.data.get("nickname")
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

def test(request):
    if Tournament.objects.exists():
        tournament = Tournament.objects.first()
        nickname_lst = []
        participants = tournament.get_participants()
        for idx, participant in enumerate(participants):
            nickname_lst.append(participant.nickname)
        response_data = {
            "bracket": nickname_lst
        }
        return JsonResponse(response_data, status=status.HTTP_200_OK)

from django.db import connection

@api_view(["GET"])
@permission_classes((IsAuthenticated,))
@authentication_classes((JWTAuthentication,))
def get_bracket(request):
    user_nickname = request.user.nickname  # 인증된 사용자의 닉네임 가져오기
    if not Tournament.objects.exists():
        return JsonResponse({'error': 'Tournament room does not exist.'}, status=status.HTTP_404_NOT_FOUND)
    
    tournament = Tournament.objects.first()
    if tournament.is_active != True:
        return JsonResponse({'error': 'Tournament has not started yet.'}, status=status.HTTP_400_BAD_REQUEST)
    
    nickname_lst = []
    myGameid = None  # 초기화

    with connection.cursor() as cursor:
        cursor.execute('''
            SELECT u.nickname
            FROM user_user u
            JOIN tournament_tournament_participants tp ON u.id = tp.user_id
            WHERE tp.tournament_id = %s
            ORDER BY tp.id ASC
        ''', [tournament.id])
        rows = cursor.fetchall()

    for idx, (nickname,) in enumerate(rows):
        nickname_lst.append(nickname)
        if nickname == user_nickname:
            if idx in [0, 1]:
                myGameid = tournament.semifinal_game1.id if tournament.semifinal_game1 else None
            elif idx in [2, 3]:
                myGameid = tournament.semifinal_game2.id if tournament.semifinal_game2 else None
    
    response_data = {
        "message": "Get bracket successfully",
        "bracket": nickname_lst,
        "myGameid": myGameid
    }
    return JsonResponse(response_data, status=status.HTTP_200_OK)

@api_view(["POST"])
@permission_classes((IsAuthenticated,))
@authentication_classes((JWTAuthentication,))
def end_semifinal(request):
    if not Tournament.objects.exists():
        return JsonResponse({'error': 'Tournament room does not exist.'}, status=status.HTTP_404_NOT_FOUND)
    
    tournament = Tournament.objects.first()
    if not tournament.is_active:
        return JsonResponse({'error': 'Tournament is not active.'}, status=status.HTTP_400_BAD_REQUEST)

    winner_nickname = request.data.get("winner_nickname")
    loser_nickname = request.data.get("loser_nickname")
    semifinal_gameid = request.data.get("semifinal_gameid")
    
    if not winner_nickname or not loser_nickname or not semifinal_gameid:
        return JsonResponse({'error': 'Invalid data.'}, status=status.HTTP_400_BAD_REQUEST)

    try:
        # 사용자 객체 가져오기
        winner = User.objects.get(nickname=winner_nickname)
        loser = User.objects.get(nickname=loser_nickname)
        
        # 준결승 게임 객체 가져오기
        semifinal_game = Game.objects.get(id=semifinal_gameid)
        
    except User.DoesNotExist:
        return JsonResponse({'error': 'Winner or loser does not exist.'}, status=status.HTTP_404_NOT_FOUND)
    except Game.DoesNotExist:
        return JsonResponse({'error': 'Semifinal game does not exist.'}, status=status.HTTP_404_NOT_FOUND)

    game_user_lst = semifinal_game.players.all()
    if winner not in game_user_lst:
        return JsonResponse({"error': 'Winner user not in game id's game"}, status=status.HTTP_400_BAD_REQUEST)
    if loser not in game_user_lst:
        return JsonResponse({"error": "Loser user not in game id's game"}, status=status.HTTP_400_BAD_REQUEST)

    # 진 사람을 participants에서 내보내기
    if tournament.host == loser:
        tournament.host = winner
        tournament.save()
    tournament.participants.remove(loser)

    # 준결승 게임 객체 삭제 및 Tournament 객체 업데이트
    semifinal_game = Game.objects.get(id=semifinal_gameid)
    
    # Tournament 객체에서 해당 게임을 참조하는 필드를 업데이트
    if tournament.semifinal_game1 == semifinal_game:
        tournament.semifinal_game1 = None
    if tournament.semifinal_game2 == semifinal_game:
        tournament.semifinal_game2 = None
    tournament.save()
    
    # 게임 객체 삭제
    semifinal_game.delete()

    # end_game_count 증가
    tournament.end_game_count += 1
    tournament.save()
    
    if tournament.end_game_count < 2:
        final_game = Game.objects.create(name="final_game", creator= winner, status=0)
        final_game.players.add(winner)
        tournament.final_game_id = final_game
        tournament.save()
        return JsonResponse({
            'message': 'First semifinal ended, final game created.',
            'final_game_id' : final_game.id
        }, status=status.HTTP_200_OK)
    
    # 결승 게임방 생성 및 participants에 남은 인원들을 추가
    elif tournament.end_game_count == 2:
        final_game = tournament.final_game_id
        final_game.players.add(winner)
        final_game.save()
        
        return JsonResponse({
            'message': 'Final game set up.',
            'final_game_id': final_game.id,
        }, status=status.HTTP_200_OK)
    return JsonResponse({'error': 'Unexpected error.'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

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
            return JsonResponse({'message': 'Tournament host changed.'}, status=status.HTTP_200_OK)
        else:
            tournament.delete()
            return JsonResponse({'message': 'Tournament room deleted.'}, status=status.HTTP_200_OK)
    
    tournament.save()

    return JsonResponse({'message': 'Out of tournament room'}, status=status.HTTP_200_OK)

@api_view(["DELETE"])
@permission_classes((IsAuthenticated,))
@authentication_classes((JWTAuthentication,))
def end_tournament(request):
    if not Tournament.objects.exists():
        return JsonResponse({'error': 'Tournament room does not exist.'}, status=status.HTTP_404_NOT_FOUND)
    
    tournament = Tournament.objects.first()
    if not tournament.is_active:
        return JsonResponse({'error': 'Tournament is not active.'}, status=status.HTTP_400_BAD_REQUEST)

    winner_nickname = request.data.get("winner_nickname")
    final_gameid = request.data.get("final_gameid")

    try:
        final_game = Game.objects.get(id=final_gameid)
        final_game.delete()
    except Game.DoesNotExist:
        return JsonResponse({'error': 'Final game does not exist.'}, status=status.HTTP_404_NOT_FOUND)
    
    if not winner_nickname:
        return JsonResponse({'error': 'Invalid data.'}, status=status.HTTP_400_BAD_REQUEST)
    
    try:
        winner = User.objects.get(nickname=winner_nickname)
    except User.DoesNotExist:
        return JsonResponse({'error': 'Winner does not exist.'}, status=status.HTTP_404_NOT_FOUND)
    
    # 토너먼트 객체 삭제
    tournament.delete()
    
    return JsonResponse({
        'message': 'Tournament has ended.',
        'winner': winner_nickname
    }, status=status.HTTP_200_OK)


# 예시로 상세보기 뷰를 작성합니다.
def tournament_detail(request, tournament_id):
    try:
        tournament = Tournament.objects.get(id=tournament_id)
    except Tournament.DoesNotExist:
        return HttpResponse("Tournament not found.", status=404)
    
    return render(request, 'tournament/tournament_detail.html', {'tournament': tournament})
