/* @jsx myReact.createElement */
import myReact, { useEffect, useState } from "../../core/myReact.js";
import HandleInviteModal from "../Navbar/HandelInviteModal.js";
import "../../css/tournament.css";
import "../../css/tournament/touranment_waiting.css";
import tc from "./TournamentController.js";
import { apiInstance } from "../../core/Api.js";

const TournamentWaiting = () => {
  const [players, setPlayers] = useState(tc.getPlayers());
  const [host, setHost] = useState(tc.getHost());
  const maxPlayers = 4;

  tc.initTournamentSocket({ setPlayers, setHost });

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
            {host && host === localStorage.getItem("nickcname") && (
              <div class="start-button-container">
                <button class="start-button" onClick={handleStartGame}>
                  시작하기
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
      <HandleInviteModal type="tournament" />
    </div>
  );
};

export default TournamentWaiting;
