/* @jsx myReact.createElement */
import myReact, { useEffect, useState, useRef } from "../../core/myReact.js";
import WaitingTournament from "./TournamentWaiting.js";
import TournamentSchedule from "./TournamentSchedule.js";
import socketController from "../../core/socket.js";
import api, { apiInstance } from "../../core/Api.js";
import Loading from "../Loading.js";
import apiTounrament from "../../core/ApiTournament.js";
import status from "./TournamentStatus.js";
import GameRoom from "./TournamentGameRoom.js";
import TournamentFinished from "./TournamentFinished.js";
import { requestJoinGame } from "../../core/ApiGame.js";

const Tournament = () => {
  const [players, setPlayers] = useState([]);
  const [host, setHost] = useState("");
  const [waitingTime, setWaitingTime] = useState(60); // 대기 시간

  const maxPlayers = 4;
  const gameId = useRef(null);
  const [bracket, setBracket] = useState([]);

  const [gameResult, setGameResult] = myReact.useGlobalState(
    "gameResult",
    null
  );
  const initState = gameResult ? status.BETWEEN_ROUND : status.LOADING;
  const [tournamentStatus, setTournamentStatus] = useState(initState);
  const initMessage = gameResult ? "준결승전 경기 완료" : "준결승전 대기중";
  const [statusMessage, setStatusMessage] = useState(initMessage);

  console.log("players", players);
  console.log("Result", gameResult, "status", tournamentStatus);

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
      //host 변경
      {
        type: "tournament_host_change",
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
    const idx = players.indexOf(data.nickname);
    if (idx === -1) {
      return;
    }
    players.splice(idx, 1);
    console.log("player leftL:", players);
    setPlayers([...players]);
  };

  const onTournamentStart = async (data) => {
    await apiInstance
      .get("tournament/get_bracket")
      .then((res) => {
        console.log(res.data);
        gameId.current = res.data.myGameid;
        setBracket(res.data.bracket);
        setTournamentStatus(status.STARTED);
      })
      .catch((err) => {
        alert(err);
        outTournament();
      });
  };

  const onGameEnd = (data) => {
    console.log("Game ended for players:", data.league);
  };

  const onHostChange = (data) => {
    console.log("Host changed to:", data.new_host);
    setHost(data.new_host);
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

  const outTournament = (type) => {
    setTournamentStatus(status.LOADING);
    setPlayers([]);
    setHost("");
    setBracket([]);
    if (type === "tournament_end") {
      alert("토너먼트가 종료되었습니다. 홈으로 돌아갑니다.");
    } else {
      socketController.sendMessage({ type: "tournament_out" });
      apiTounrament.out();
    }
    myReact.redirect("home");
  };

  // const onSemifinalEnd = async (data) => {
  //   try {
  //     const res = await apiTounrament.end_semifinal(gameResult);
  //     console.log("onSemifinalEnd", res);
  //     alert(res.message);
  //     gameId.current = res.final_game_id;
  //   } catch (err) {
  //     alert(err);
  //     outTournament();
  //   }
  //   return;
  // };

  // 상태에 따른 init
  useEffect(async () => {
    switch (tournamentStatus) {
      case status.LOADING: {
        document.onpopstate = outTournament;
        try {
          const data = await apiTounrament.enter();
          console.log("got data", data);
          if (data.status !== 208) {
            socketController.sendMessage({ type: "tournament_in" });
          }
          setPlayers(data.players);
          setHost(data.host || data.players[0]);
          setTournamentStatus(status.READY);
        } catch (err) {
          alert(err);
          console.log(err);
          // myReact.redirect("home");
        }
        return () => {
          document.removeEventListener("popstate", outTournament);
        };
      }
      case status.BETWEEN_ROUND:
        console.log("between round");
        console.log("gameResult", gameResult);
        if (gameResult.loser === localStorage.getItem("nickname")) {
          socketController.sendMessage({ type: "tournament_out" });
          alert("세미 파이널에서 탈락하셨습니다.");
          outTournament("tournament_end");
        } else {
          // socketController.sendMessage({
          //   type: "tournament_end",
          //   status: "tournament_semifinal_end",
          // }); //백엔드 쪽 수정 필요
          try {
            const res = await apiTounrament.end_semifinal(gameResult);
            console.log("onSemifinalEnd", res);
            alert(res.message);
            gameId.current = res.final_game_id;
            // 메시지로 판단하여 두 팀 다 끝났을 경우에만 웹소켓 전송
            if (res.message === "Final game set up.") {
              socketController.sendMessage({
                type: "tournament_end",
                status: "tournament_semifinal_end",
              });
              setStatusMessage("준결승전 경기 완료 : 결승전을 시작하세요");
            } else {
              setStatusMessage(
                "준결승전 경기 진행중 : 다음 경기를 기다리세요. 채팅을 확인하세요"
              );
            }
          } catch (err) {
            alert(err);
            outTournament();
          }
        }
        break;
      case status.FINISHED: {
        if (gameResult.winner === localStorage.getItem("nickname")) {
          // socketController.sendMessage({
          //   type: "tournament_end",
          //   status: "tournament_final_end",
          // });
          await apiTounrament.end_tournament(gameResult);
          socketController.sendMessage({
            type: "tournament_end",
            status: "tournament_final_end",
            winner_nickname: gameResult.winner,
          });
        }
      }
    }
  }, []);
  socketController.initSocket();

  async function startGame() {
    console.log(startGame);
    await requestJoinGame(gameId.current, "").catch((err) => {
      return alert(err.response.data.message || err.message || err);
    });
    myReact.redirect("tournament/" + gameId.current);
  }

  function inviteTournament() {
    apiInstance
      .post("tournament/invite_tournament", {
        nickname: "milky",
      })
      .then((res) => {
        alert("milky님을 초대했습니다");
      })
      .catch((err) => {
        console.log(err);
      });
  }

  switch (tournamentStatus) {
    case status.READY: {
      console.log("tournamentState ready");
      return (
        <div id={"tournament"}>
          <WaitingTournament
            handleStartGame={handleStartGame}
            players={players}
            host={host}
          />
          <button onClick={inviteTournament}>초대하기</button>
          <button onClick={outTournament}>나가기</button>
        </div>
      );
    }
    case status.STARTED:
    case status.BETWEEN_ROUND: {
      return (
        <TournamentSchedule
          bracket={bracket}
          status={statusMessage || "4강 대기중"}
          startGame={startGame}
        />
      );
    }
    case status.FINISHED: {
      return (
        <TournamentFinished
          tournamentResult={gameResult}
          outTournament={outTournament}
        />
      );
    }
    case status.ROUND_ONE:
    case status.ROUND_TWO: {
      return <GameRoom id={gameId.current} />;
    }
    default: {
      //status.LOADING
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
