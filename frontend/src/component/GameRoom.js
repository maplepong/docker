// let gameSocket = null;

/* @jsx myReact.createElement */
import myReact, { useEffect, useState, useRef } from "../core/myReact.js";
import { requestGameInfo, requestExitGame } from "../core/ApiGame.js";
import "../css/GameRoom.css";
import "../css/Pingpong.css";
import PingPong from "./Game.js";
import Chat from "./Chat.js";

const GameRoom = () => {
  const [ready, setReady] = useState(false);
  const gameSocket = useRef(null);
  const [exit, setExit] = useState(false);
  const [gameInfo, setGameInfo] = useState({
    id: "",
    name: "",
    current_players_num: "",
    owner: "",
    password: "",
    players: [],
    status: "",
    isGameReady: false,
    owner_info: {},
    player_info: {},
  });

  useEffect(() => {
    const fetchGameInfo = async () => {
      const path = window.location.pathname;
      const gameIdMatch = path.match(/^\/gameroom\/(\d+)$/);

      if (gameIdMatch) {
        const gameId = gameIdMatch[1];
        try {
          const data = await requestGameInfo(gameId);
          if (data.status === 200) {
            const updatedGameInfo = data.data;
            updatedGameInfo.owner_info = updatedGameInfo.players.find(
              (player) => player.nickname === updatedGameInfo.owner
            );
            updatedGameInfo.player_info = updatedGameInfo.players.find(
              (player) => player.nickname !== updatedGameInfo.owner
            );
            setGameInfo(updatedGameInfo);
          } else {
            console.error("Failed to fetch game info:", data);
          }
        } catch (error) {
          console.error("Failed to fetch game info:", error);
        }
      } else {
        console.error("Invalid gameIdMatch:", gameIdMatch);
      }
    };

    fetchGameInfo();

    return () => {
      if (gameSocket.current) {
        gameSocket.current.close();
        gameSocket.current = null;
      }
    };
  }, []);

  useEffect(() => {
    if (gameInfo.id && !gameSocket.current && !exit) {
      const newgameSocket = new WebSocket(
        "ws://localhost/api/ws/game/" + gameInfo.id + "/"
      );
      console.log("Creating new WebgameSocket connection...");
      newgameSocket.onopen = () => {
        console.log("서버 연결 완료");
        newgameSocket.send(
          JSON.stringify({
            type: "client_connected",
            nickname: localStorage.getItem("nickname"),
          })
        );
      };
      gameSocket.current = newgameSocket;
    }
    if (gameSocket.current && !exit) {
      gameSocket.current.onmessage = (event) => {
        const data = JSON.parse(event.data);
        console.log("data : ", data);
        if (data.type === "game_ready") {
          console.log("game_ready");
          console.log("data.player_info : ", data.player_info);
          setGameInfo({
            ...gameInfo,
            isGameReady: true,
            player_info: data.player_info,
          });
        } else if (data.type === "game_start") {
          console.log("game_start");
          setReady(true);
        } else if (data.type === "client_left") {
          console.log("client_left");

          if (gameInfo.owner === localStorage.getItem("nickname")) {
            console.log("나는 오너");
            setGameInfo({
              ...gameInfo,
              players: gameInfo.players.filter(
                (player) => player.nickname === gameInfo.owner
              ),
              isGameReady: false,
              player_info: {},
              current_players_num: 1,
            });
          } else {
            console.log("나는 게스트");
            setGameInfo({
              ...gameInfo,
              players: gameInfo.players.filter(
                (player) => player.nickname !== gameInfo.owner
              ),
              owner: localStorage.getItem("nickname"),
              owner_info: gameInfo.player_info,
              isGameReady: false,
              player_info: {},
              current_players_num: 1,
            });
          }
        }
      };

      gameSocket.onclose = () => {
        console.log("서버 연결 종료");
        gameSocket.current = null;
      };
    }
  }),
    [gameInfo.id];

  const startGame = () => {
    if (gameSocket.current)
      gameSocket.current.send(
        JSON.stringify({
          type: "game_start",
          nickname: localStorage.getItem("nickname"),
        })
      );
  };

  const exitGame = async () => {
    console.log("--------exit");
    if (gameSocket.current) {
      gameSocket.current.send(
        JSON.stringify({
          type: "client_left",
          nickname: localStorage.getItem("nickname"),
        })
      );
      gameSocket.current.close();
      gameSocket.current = null;
      setExit(true);
    }
    const response = await requestExitGame(gameInfo.id);
    if (response && response.status === 200) console.log("exitGame success");

    myReact.redirect("lobby");
  };

  return ready ? (
    <div className="game-container">
      <canvas id="myCanvas" width="240" height="160"></canvas>
      <PingPong gameinfo={gameInfo} gameSocket={gameSocket} />
    </div>
  ) : gameInfo.id ? (
    <div class="bg">
      <div class="room">
        <div class="room_header">
          <span class="room_title">{gameInfo.name} </span>
          <span class="locked">****</span>
          <span>
            <input type="button" class="pwdbtn" />
          </span>
        </div>
        <div class="game_interface">
          <div class="closebtn-section">
            <input type="button" class="closebtn" onClick={exitGame} />
          </div>
          <div class="top-section">
            <div class="owner">
              {gameInfo.owner_info ? (
                <div>
                  <img src={gameInfo.owner_info.image} class="owner-img"></img>
                  <div class="owner_name">{gameInfo.owner_info.nickname}</div>
                  <div class="owner_stat">{gameInfo.owner_info.win_rate}</div>
                </div>
              ) : null}
            </div>
            <div class="logo-section">
              <input type="button" class="logo"></input>
              {gameInfo.owner === localStorage.getItem("nickname") ? (
                <div>
                  <input
                    type="button"
                    class="strbtn"
                    onClick={startGame}
                  ></input>
                  <input type="button" class="invbtn"></input>
                </div>
              ) : (
                <span>아무거또 모태</span>
              )}
            </div>
            <div class="player">
              {gameInfo.player_info && gameInfo.player_info.nickname ? (
                <div>
                  <img
                    src={gameInfo.player_info.image}
                    class="player-img"
                  ></img>
                  <div class="player_name">{gameInfo.player_info.nickname}</div>
                  <div class="player_stat">{gameInfo.player_info.win_rate}</div>
                </div>
              ) : (
                <div>
                  <div class="player-img"></div>
                  <div class="player_name">기다리는 중...</div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
      {/* <Chat gameId={gameInfo.id}/> */}
    </div>
  ) : (
    <div>
      <h2>Room Number: No Room</h2>
    </div>
  );
};

export default GameRoom;
