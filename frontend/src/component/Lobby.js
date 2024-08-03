/* @jsx myReact.createElement */
import myReact, { useEffect, useState } from "../core/myReact.js";
import {
  requestLobbyList,
  requestCreateGame,
  requestGameInfo,
  requestJoinGame,
} from "../core/ApiGame.js";
import api from "../core/Api.js";
import router from "../core/Router.js";
import GameList from "./GameList.js";

const Lobby = (props) => {
  // const [lobbyData, setLobbyData] = useState([]);
  const [lobbyData, setLobbyData] = useState([]);

  const noRoomData = {
    //test
    current_players_num: 2,
    id: 1234,
    name: "로딩 중입니다...",
    owner: "test",
    password: "asdjfoierfaofaf",
    players: ["pl1", "pl2"],
    status: "0",
  };
  console.log(lobbyData);

  async function requestLogin() {
    const res = await api.login(() => ["test1", "1234"]);
    console.log(res);
  }

  const create_game = async () => {
    console.log("create_game");
    const roomTitleElement = document.querySelector("#room-name");
    const passwordElement = document.querySelector("#room-password");
    const vibrationElement = document.querySelector("#vibration");

    if (!roomTitleElement || !passwordElement || !vibrationElement) {
      console.error("Required DOM elements are not found");
      return;
    }

    const room_title = roomTitleElement.value;
    const password = passwordElement.value;
    const vibration = vibrationElement.checked;

    console.log(
      "room_title:",
      room_title,
      "password:",
      password,
      "vibration:",
      vibration
    );

    try {
      const createGameResponse = await requestCreateGame(room_title, password);
      if (createGameResponse.status === 201) {
        console.log("Game created successfully");
        myReact.redirect("gameroom/" + createGameResponse.data.id);
      } else {
        console.error("Failed to create game:", createGameResponse);
      }
    } catch (error) {
      alert("Failed to create game:", error);
      updateList();
    }
  };

  const updateList = async () => {
    const res = await requestLobbyList();
    if (res === null) {
      return console.log("requestLobbyList error");
    }
    console.log("Received lobby list:", res);
    setLobbyData(res);
  };

  // 방 정보를 받아서 li node로 변환시켜주는 함수
  // 클래스네임까지 아래 리턴에서 처리할려면 정신없을거같아 함수로 빼둠
  const newRoomInfo = (room) => {
    const className =
      room.status === "대기중" ? "room_info wating" : "room_info playing";
    return (
      <li class={className} onclick={() => joinGame(room.id)} key={room.id}>
        <span class="room_number">{room.id}</span>
        <span class="room_title">{room.name}</span>
        <span class="players">{room.players}</span>
        <span class="room_status">{room.current_players_num}</span>
        <span class="locked">
          {room.password ? (
            <img src="lock.png" alt="🔒" />
          ) : (
            <img src="unlock.png" alt="🔓" />
          )}
        </span>
      </li>
    );
  };

  const joinGame = async (gameId) => {
    console.log(gameId);
    const gameInfo = await requestGameInfo(gameId);
    if (!gameInfo.status || gameInfo.status !== 200)
      return console.error("Failed to get game info:", gameInfo);
    let password = null;
    if (gameInfo.data.password !== null)
      password = prompt("비밀번호를 입력하세요");
    const joinGameResponse = await requestJoinGame(gameId, password);
    if (joinGameResponse.status && joinGameResponse.status === 201) {
      history.pushState({}, "", `/gameroom/${gameId}`);
      router();
    } else if (joinGameResponse.status === 400) alert("비밀번호가 필요합니다.");
    else if (joinGameResponse.status === 403) alert("비밀번호가 틀렸습니다.");
    else if (joinGameResponse.status === 409) alert("방에 입장할 수 없습니다.");
    else alert("게임 입장 실패");
  };

  useEffect(updateList, []);
  const modal = document.getElementById("modal");
  const backdrop = document.getElementById("modal-backdrop");
  function openModal() {
    modal.classList.toggle("hidden");
    backdrop.classList.toggle("hidden");
  }

  return (
    <div id="container-lobby" className="modal">
      <button onClick={requestLogin}>login: test</button>
      <div id="lobby-headline">
        <p>Pingpong🏓</p>
        <button>X</button>
        <button id="open-modal" onClick={openModal}>
          게임 만들기
        </button>
        <div id="modal-backdrop" class="hidden"></div>
      </div>
      <div id="modal" class="hidden">
        <div id="modal-content">
          <form id="room-form" onSubmit={create_game}>
            <div id="modal-title">방 제목</div>
            <input
              type="text"
              id="room-name"
              name="room-name"
              placeholder="방 제목 입력"
            ></input>
            <div id="checkbox-container">
              <input type="checkbox" id="vibration" name="vibration"></input>
              <label htmlFor="vibration">비밀방 설정</label>
            </div>
            <input
              type="password"
              id="room-password"
              name="room-password"
              placeholder="비밀번호 입력"
            ></input>
            <div id="modal-buttons">
              <input
                type="button"
                id="cancelbtn"
                onClick={openModal}
                value="취소"
              ></input>
              <input
                type="button"
                id="confirmbtn"
                onClick={create_game}
                value="확인"
              ></input>
            </div>
          </form>
        </div>
      </div>
      <button onClick={updateList}>방이 있을까?</button>
      <div class="game_interface">
        <div class="lobby_body">
          <ul class="room_list" id="roomList">
            <li class="room_header" key="0">
              <span class="room_number">방 번호</span>
              <span class="room_title">방 제목</span>
              <span class="players">인원</span>
              <span class="room_status">상태</span>
              <span class="locked">잠금</span>
            </li>
            {lobbyData && lobbyData.length
              ? lobbyData.map((room) => newRoomInfo(room))
              : newRoomInfo(noRoomData)}
          </ul>
        </div>
      </div>
    </div>
  );
};

export default Lobby;
