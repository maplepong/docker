/* @jsx myReact.createElement */
import myReact, { useEffect, useState } from "../../core/myReact.js";
import HandleInviteModal from "../Navbar/HandelInviteModal.js";
import "../../css/tournament.css";
import "../../css/tournament/touranment_waiting.css";
import tc from "./TournamentController.js";
import { apiInstance } from "../../core/Api.js";
import socketController from "../../core/socket.js";

const TournamentWaiting = () => {
  const [players, setPlayers] = useState(tc.getPlayers());
  console.log(players);
  console.log(tc.getPlayers());
  const [host, setHost] = useState(tc.getHost());
  const maxPlayers = 4;

  socketController.initSocket();
  useEffect(() => {
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
          onHostChange(data);
        },
      },
    ]);
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
  const onHostChange = (data) => {
    console.log("Host changed to:", data.new_host);
    setHost(data.new_host);
  };
  const onTournamentStart = async (data) => {
    await apiInstance
      .get("tournament/get_bracket")
      .then((res) => {
        console.log(res.data);
        tc.setInfo({ bracket: res.data.bracket, gameId: res.data.myGameid });
        tc.nextStatus();
      })
      .catch((err) => {
        alert(err);
        outTournament();
      });
  };

  const confirmTournament = async () => {
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
        tc.setInfo({ players, host });
        socketController.sendMessage({ type: "tournament_start" });
      })
      .catch((err) => {
        alert(err);
        tc.outTournament();
        return;
      });
  };

  return (
    <div class="tournament-container">
      <div class="tournament-header">
        <p class="tournament-title">Tournament 이름</p>
        <div id="box" class="tournament-content">
          <div class="player-list">
            {players.map((player, index) => (
              <span key={index} class="users">
                <p>{player}</p>
              </span>
            ))}
          </div>
          <div class="tournament-details">
            <div>주최자: {host}</div>
            <div>최대 인원: 4명</div>
            {/* {host && host === localStorage.getItem("nickcname") && ( */}
              <div class="start-button-container">
                <button class="start-button" onClick={confirmTournament}>
                  시작하기
                </button>
              </div>
           
          </div>
        </div>
      </div>
      <button onClick={tc.outTournament}>나가기</button>
      <HandleInviteModal type="tournament" />
    </div>
  );
};

export default TournamentWaiting;
