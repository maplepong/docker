// let gameSocket = null;

/* @jsx myReact.createElement */
import myReact, { useEffect, useState, useRef } from "../../core/myReact.js";
import { requestGameInfo, requestExitGame } from "../../core/ApiGame.js";
import "../../css/GameRoom.css";
import "../../css/Pingpong.css";
import PingPong from "./PlayingGame.js";
import SocketController from "../../core/socket.js";
import Loading from "../Loading.js";
import WaitingGame from "./WaitingGame.js";
import ResultGame from "./ResultGame.js";

const status = {
  loading: 0,
  waiting: 1,
  playing: 2,
  finished: 3,
};

const GameRoom = () => {
  // const [ready, setReady] = useState(false);
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
  const [gameStatus, setGameStatus] = useState(status.loading);
  const gameResult = useRef(null);

  const sendGameInvite = (gameId, nickname) => {
    const data = {
      type: "invite",
      gameId: gameId,
      message: "테스트입니다.",
      receiver: nickname,
    };
    console.log(data);
    SocketController.sendMessage(data);
  };

  useEffect(() => {
    const fetchGameInfo = async () => {
      SocketController.initSocket();

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
            setGameStatus(status.waiting);
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
          console.log("game_ready");
          console.log("data.player_info : ", data.player_info);
          setGameInfo({
            ...gameInfo,
            isGameReady: true,
            player_info: data.player_info,
          });
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
          sendGameInvite={sendGameInvite}
        />
      );
    case status.playing:
      return (
        <div className="game-container">
          <canvas id="myCanvas" width="800" height="640"></canvas>
          <PingPong
            gameinfo={gameInfo}
            gameSocket={gameSocket}
            gameResult={gameResult}
            setStatus={setGameStatus}
          />
        </div>
      );
    case status.finished:
      const isUserWin =
        gameResult.current.userScore > gameResult.current.enemyScore;
      console.log("player", gameInfo.players);
      const opponent =
        gameInfo.owner === localStorage.getItem("nickname")
          ? gameInfo.player
          : gameInfo.owner;
      const data = {
        game_id: gameInfo.id,
        winner: isUserWin ? localStorage.getItem("nickname") : opponent,
        loser: isUserWin ? opponent : localStorage.getItem("nickname"),
        loser_score: isUserWin
          ? gameResult.current.enemyScore
          : gameResult.current.userScore,
        winner_score: isUserWin
          ? gameResult.current.userScore
          : gameResult.current.enemyScore,
      };
      console.log("data", data);
      return <ResultGame gameResult={data} />;
    default:
      return <Loading type="game" />;
  }
};

export default GameRoom;
