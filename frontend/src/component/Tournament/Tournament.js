/* @jsx myReact.createElement */
import myReact, { useEffect, useState } from "../../core/myReact.js";
import WaitingTournament from "./TournamentWaiting.js";
import TournamentSchedule from "./TournamentSchedule.js";
import socketController from "../../core/socket.js";
import api, { apiInstance } from "../../core/Api.js";
import Loading from "../Loading.js";
import apiTounrament from "../../core/ApiTournament.js";

const Tournament = () => {
  const [players, setPlayers] = useState([]);
  const [host, setHost] = useState("");
  const [waitingTime, setWaitingTime] = useState(60); // 대기 시간
  const [gameStarted, setGameStarted] = useState(false);
  const maxPlayers = 4;

  useEffect(() => {
    socketController.initSocket();
    socketController.setSocketTypes([
      { type: "tournament", func: handleTournamentMessage },
    ]);
    // 방에 입장 요청
    enterTournament();
    // 클린업 함수로 컴포넌트 언마운트 시 소켓 해제
    return () => {
      socketController._ws.current.close();
    };
  }, []);

  const handleTournamentMessage = (data) => {
    switch (data.status) {
      case "new-user":
        onPlayerJoined(data);
        break;
      case "out-user":
        onPlayerLeft(data);
        break;
      case "full-room":
        onRoomFull(data);
        break;
      case "tournament-start":
        onTournamentStart(data);
        break;
      case "game-end":
        onGameEnd(data);
        break;
      case "other-team-end":
        onOtherTeamEnd(data);
        break;
      case "tournament-end":
        onTournamentEnd(data);
        break;
      default:
        console.error("Unknown tournament status:", data.status);
    }
  };

  const enterTournament = () => {
    socketController.sendMessage({ type: "tournament", action: "enter" });
  };

  const onPlayerJoined = (data) => {
    console.log(data);
    setPlayers((prevPlayers) => [...prevPlayers, data.nickname]);
    if (!host) {
      setHost(data.nickname); // 첫 번째 입장자가 방장
    }
  };

  const onPlayerLeft = (data) => {
    setPlayers((prevPlayers) => {
      const newPlayers = prevPlayers.filter(
        (player) => player !== data.nickname
      );
      if (data.nickname === host && newPlayers.length > 0) {
        // 방장이 나갔을 경우 새로운 방장을 랜덤으로 선정
        const newHost =
          newPlayers[Math.floor(Math.random() * newPlayers.length)];
        setHost(newHost);
        console.log(`New host is: ${newHost}`);
      }
      return newPlayers;
    });
  };

  const onRoomFull = (data) => {
    console.log("Room is full. Game can start now.");
  };

  const onTournamentStart = (data) => {
    setGameStarted(true);
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

  const handleStartGame = () => {
    const currentUser = localStorage.getItem("nickname");
    if (host !== currentUser) {
      alert("Only the host can start the game.");
      return;
    }
    if (players.length < maxPlayers) {
      alert("Not enough players to start the game.");
      return;
    }
    socketController.sendMessage({ type: "tournament", action: "start" });
  };
  console.log("players", players);
  console.log("host", host);

  const outTournament = () => {
    apiTounrament.out();
  };

  //방 입장
  useEffect(async () => {
    document.onpopstate = outTournament;
    try {const temp =(await apiTounrament.enter())
      setPlayers(temp);
      setHost(temp[0]);
    }
    catch (err) {
      alert(err);
      console.log(err);
      myReact.redirect("/home");
    }
    return () => {
      document.removeEventListener("popstate", outTournament);
    };
  }, []);

  if (host == "") {
    return (
      <div>
        <Loading type="tournament" />{" "}
        <button onClick={outTournament}>나가기</button>{" "}
      </div>
    );
  }
  return (
    <div id={"tournament"}>
      <WaitingTournament
        handleStartGame={handleStartGame}
        players={players}
        host={host}
        gameStarted={gameStarted}
      />
    </div>
  );
};

export default Tournament;
