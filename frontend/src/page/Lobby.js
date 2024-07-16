/* @jsx myReact.createElement */
import myReact, { useEffect, useState } from "../core/myReact.js";
import { requestLobbyList, requestCreateGame } from "../core/ApiGame.js";
import api from "../core/Api_.js";
import Gamelist from "../component/GameList.js";

const Lobby = () => {
  const [lobbyData, setLobbyData] = useState([]);

  async function requestLogin() {
    const res = await api.login(() => {
      return ["test", "4545"];
    });
  }

  const resultLobby = (responsedata) => {
    setLobbyData(responsedata);
  };

  const resultCreateGame = (responsedata) => {
    console.log("responsedata : ", responsedata);
  };

  const create_game = async () => {
    const room_title = document.querySelector("#room-name").value;
    const password = document.querySelector("#room-password").value;
    const vibration = document.querySelector("#vibration").checked;
    resultCreateGame(await requestCreateGame(room_title, password));
    const res = await requestLobbyList();
    if (res === null) return console.log("requestLobbyList error");
    resultLobby(res);
  };

  const updateList = async () => {
    const res = await requestLobbyList();
    if (res === null) return console.log("requestLobbyList error");
    setLobbyData(res);
  };

  useEffect(updateList, []);

  return (
    <div id="container-lobby" className="modal">
      <button onclick={requestLogin}>login: test</button>
      <div id="lobby-headline">
        <p>Pingpong🏓</p>
        <button>X</button>
        <button id="open-modal" onClick={create_game}>
          게임 만들기
        </button>
        <div id="modal-backdrop" className="hidden"></div>
      </div>
      <div id="modal" className="hidden">
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
              <input type="button" id="cancelbtn" value="취소"></input>
              <input type="submit" id="confirmbtn" value="확인"></input>
            </div>
          </form>
        </div>
      </div>
      <GameList />
    </div>
  );
};

export default Lobby;
