/* @jsx myReact.createElement */
import myReact, { useEffect, useState } from "../core/myReact.js";
import { requestLobbyList, requestCreateGame, requestGameInfo, requestJoinGame } from "../core/ApiGame.js";
import "../css/lobby.css"

const GameList = () => {
	const updateList = async () => {
        const res = await requestLobbyList();
        if (res === null) {
            return console.log("requestLobbyList error");
        }
        console.log("Received lobby list:", res);
        setLobbyData(res);
    };

    useEffect(updateList, []);
	return (
	<div class="lobby">
		<div class="lobby_header">
			Pingpong🏓
			<input type="button" class="crtbtn" id="open-modal" />
			{/* <div id="modal-backdrop" class="hidden" /> */}
		</div>
		<div id="modal">
			<div id="modal-content">
				<div id="modal-header">
					<div id = "modal-icon"><img src="asset/Lobby/game-icon.png" alt="게임 컨트롤러 아이콘" /></div>
				</div>
				<form id="room-form">
					<div id="modal-title">방 제목</div>
					<input type="text" class="room-name" name="room-name" placeholder="방 제목 입력" required />
					<div id="checkbox-container">
						<input type="checkbox" class="vibration" name="vibration" />
						<label for="vibration">비밀방 설정</label>
					</div>
					<input type="password" id="room-password" name="room-password" placeholder="비밀번호 입력" />
					<div id="modal-buttons">
						<input type="button" id="cancelbtn" value="취소"></input>
						<input type="submit" id="confirmbtn" value="확인"></input>
					</div>
				</form>
			</div>
		</div>
		<div class="game_interface">
			<div class="lobby_body">
				<ul class="room_info" id="roomList">
					<li class="room_header">
						<span class="room_number">방 번호</span>
						<span class="room_title">방 제목</span>
						<span class="players">인원</span>
						<span class="room_status">방 상태</span>
					</li>
				</ul>
			</div>
		</div>
	</div>
	)
}

export default GameList;