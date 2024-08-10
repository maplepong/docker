// let gameSocket = null;

/* @jsx myReact.createElement */
import myReact, { useEffect, useState, useRef } from "../../core/myReact.js";
import { requestGameInfo, requestExitGame } from "../../core/ApiGame.js";
import "../../css/GameRoom.css";
import "../../css/Pingpong.css";
import PingPong from "../Game/PlayingGame.js";
import SocketController from "../../core/socket.js";
import Loading from "../Loading.js";
import WaitingGame from "../Game/WaitingGame.js";
import tc from "./TournamentController.js";

const status = {
  loading: 0,
  waiting: 1,
  playing: 2,
  finished: 3,
  return: 4, // 토너먼트로 돌아가기
};

const TournamentGameRoom = () => {
  const gameId = tc.getGameId();
  const gameSocket = useRef(null);
  const [exit, setExit] = useState(false);
  const [gameStatus, setGameStatus] = useState(status.loading);
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
    opponent: "",
  });

  const gameResultRef = useRef(null); // playing game에서 받아오는 용도

  useEffect(async () => {
    if (gameStatus === status.return) {
      tc.setInfo({ result: gameResultRef.current });

      tc.nextStatus();
    } else if (gameStatus === status.finished) {
      console.log("GameResult", gameResultRef.current);
      tc.setInfo({ result: gameResultRef.current });
      setGameStatus(status.return);
    }
  }, [gameStatus]);

  const sendGameInvite = (gameId, nickname) => {
    alert("게임 초대가 불가능한 방입니다");
  };

  useEffect(async () => {
    SocketController.initSocket();

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
        if (updatedGameInfo.players.length === 2) {
          updatedGameInfo.opponent = updatedGameInfo.players.find(
            (player) => player.nickname !== localStorage.getItem("nickname")
          ).nickname;
        }
        setGameInfo(updatedGameInfo);
        setGameStatus(status.waiting);
      } else {
        console.error("Failed to fetch game info:", data);
      }
    } catch (error) {
      console.error("Failed to fetch game info:", error);
    }

    return () => {
      if (gameSocket.current) {
        gameSocket.current.close();
        gameSocket.current = null;
      }
    };
  }, []);

  useEffect(async () => {
    if (gameInfo.id && !gameSocket.current && !exit) {
      const newgameSocket = new WebSocket(
        "wss://localhost:443/ws/game/" + gameInfo.id + "/",
        ["token", localStorage.getItem("accessToken")]
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
          if (gameInfo.players.length === 2) return; // 이미 2명이 들어와있으면 무시
          console.log("game_ready");
          console.log("data.player_info : ", data.player_info);
          if (gameInfo.owner === data.player_info.nickname) {
            setGameInfo({
              ...gameInfo,
              isGameReady: true,
              players: [...gameInfo.players, data.player_info],
              owner_info: data.player_info,
              opponent: data.player_info.nickname,
            });
          } else if (gameInfo.owner !== data.player_info.nickname) {
            setGameInfo({
              ...gameInfo,
              isGameReady: true,
              players: [...gameInfo.players, data.player_info],
              opponent: data.player_info.nickname,
              player_info: data.player_info,
            });
          }
        } else if (data.type === "game_start") {
          console.log("game_start");
          setGameStatus(status.playing);
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

  switch (gameStatus) {
    case status.waiting:
      return (
        <WaitingGame
          gameInfo={gameInfo}
          startGame={startGame}
          exitGame={exitGame}
          type="tournament"
        />
      );
    case status.playing:
      return (
        <div className="game-container">
          <canvas id="myCanvas" width="800" height="640"></canvas>
          <PingPong
            gameinfo={gameInfo}
            gameSocket={gameSocket}
            gameResult={gameResultRef}
            setStatus={setGameStatus}
          />
        </div>
      );
    default:
      return (
        <div>
          <p>game Status: {gameStatus}</p>
          <Loading type="game" />
        </div>
      );
  }
};

export default TournamentGameRoom;
