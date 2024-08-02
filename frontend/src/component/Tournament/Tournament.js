/* @jsx myReact.createElement */
import myReact, { useEffect, useState, useRef } from "../../core/myReact.js";
import WaitingTournament from "./TournamentWaiting.js";
import TournamentSchedule from "./TournamentSchedule.js";
import socketController from "../../core/socket.js";
import api, { apiInstance } from "../../core/Api.js";
import Loading from "../Loading.js";
import apiTounrament from "../../core/ApiTournament.js";
import status from "./TournamentStatus.js";
import GameRoom from "../Game/TournamentGameRoom.js";

const Tournament = () => {
  const [players, setPlayers] = useState([]);
  const [host, setHost] = useState("");
  const [waitingTime, setWaitingTime] = useState(60); // 대기 시간
  const [gameStatus, setGameStatus] = useState(status.LOADING);
  const maxPlayers = 4;
  const gameId = useRef(null);
  const [bracket, setBracket] = useState([]);
  console.log("players", players);

  useEffect(() => {
    socketController.initSocket();
    socketController.setSocketTypes([
      // 시작전 유저 입장
      {
        type: "tournament_in",
        func: function (data) {
          onPlayerJoined(data);
        },
      },
      // 시작전 유저 퇴장
      {
        type: "tournament_out",
        func: function (data) {
          onPlayerLeft(data);
        },
      },
      // 토너먼트 시작
      {
        type: "tournament_start",
        func: function (data) {
          onTournamentStart(data);
        },
      },
      // 한 게임 끝
      {
        type: "tournament-game-end",
        func: function (data) {
          onGameEnd(data);
        },
      },
      //host 변경
      {
        type: "tournament-host-change",
        func: function (data) {
          onGameEnd(data);
        },
      },
    ]);
    // 방에 입장 요청
    socketController.sendMessage({ type: "tournament", action: "enter" });
    // 클린업 함수로 컴포넌트 언마운트 시 소켓 해제
    // return () => {
    //   if (_ws.current) socketController._ws.current.close();
    //   _ws.current = null;
    // };
  });

  const onPlayerJoined = (data) => {
    console.log("playerJoined", data);
    if (players.includes(data.nickname)) {
      console.log(...players, data.nickname, "player alreay exists");
      return;
    }
    setPlayers([...players, data.nickname]);
    console.log(...players, data.nickname, "player");
  };

  const onPlayerLeft = (data) => {
    console.log("playerLeft", data);
    setPlayers((prevPlayers) => {
      const newPlayers = prevPlayers.filter(
        (player) => player !== data.nickname
      );
      return newPlayers;
    });
  };

  const onTournamentStart = async (data) => {
    await apiInstance
      .get("tournament/get_bracket")
      .then((res) => {
        console.log(res.data);
        setBracket(res.data.bracket);
        gameId.current = res.data.myGameid;
      })
      .catch((err) => {
        alert(err);
        outTournament();
      });
    setGameStatus(status.STARTED);
  };

  const onGameEnd = (data) => {
    console.log("Game ended for players:", data.league);
  };

  const onOtherTeamEnd = (data) => {
    console.log("Other team game ended. Result:", data.result);
  };

  const onTournamentEnd = (data) => {
    console.log("Tournament ended. Result:", data.result);
  };

  const handleStartGame = async () => {
    const currentUser = localStorage.getItem("nickname");
    if (host !== currentUser) {
      alert("Only the host can start the game.");
      return;
    }
    if (players.length < maxPlayers) {
      alert("Not enough players to start the game.");
      return;
    }
    await apiInstance
      .request({ method: "POST", url: "tournament/start_semifinal" })
      .then((res) => {
        console.log(res);
      })
      .catch((err) => {
        alert(err);
        // outTournament();
        return;
      });

    socketController.sendMessage({ type: "tournament_start" });
  };
  console.log("players", players);
  console.log("host", host);

  const outTournament = () => {
    setGameStatus(status.LOADING);
    socketController.sendMessage({ type: "tournament_out" });
    apiTounrament.out();
    myReact.redirect("home");
  };

  //방 입장
  useEffect(async () => {
    document.onpopstate = outTournament;
    try {
      const data = await apiTounrament.enter();
      console.log("got data", data);
      if (data.status !== 208) {
        socketController.sendMessage({ type: "tournament_in" });
      }
      setPlayers(data.players);
      setHost(data.players[0]);

      setGameStatus(status.READY);
    } catch (err) {
      alert(err);
      console.log(err);
      // myReact.redirect("home");
    }
    return () => {
      document.removeEventListener("popstate", outTournament);
    };
  }, []);
  socketController.initSocket();

  function startGame() {
    setGameStatus(status.ROUND_ONE);
  }

  switch (gameStatus) {
    case status.READY:
      return (
        <div id={"tournament"}>
          <WaitingTournament
            handleStartGame={handleStartGame}
            players={players}
            host={host}
          />
          <button onClick={outTournament}>나가기</button>
        </div>
      );
    case status.STARTED || status.BETWEEN_ROUND || status.FINISHED: {
      return (
        <TournamentSchedule
          bracket={bracket}
          status={gameStatus}
          startGame={startGame}
        />
      );
    }
    case status.ROUND_ONE || status.ROUND_TWO: {
      return <GameRoom id={gameId.current} />;
    }
    case status.LOADING: {
      return (
        <div>
          <Loading type="tournament" />
          <button onClick={outTournament}>나가기</button>
        </div>
      );
    }
  }
};

export default Tournament;
