/* @jsx myReact.createElement */
import { requestJoinGame } from "../../core/ApiGame.js";
import myReact from "../../core/myReact.js";
import "../../css/tournament/tournament_schedule.css";
import tc from "./TournamentController.js";

const TournamentSchedule = () => {
  const bracket = tc.getBracket();
  const status = tc.getStatus() === 2 ? "semifinal" : "final";
  const title = tc.getStatus() === 2 ? "준결승전" : "결승전";
  tc.initTournamentSocket({ setPlayers, setHost });

  const startGame = async () => {
    console.log(startGame);
    await requestJoinGame(gameId.current, "").catch((err) => {
      return alert(err.response.data.message || err.message || err);
    });
    myReact.redirect("tournament/" + gameId.current);
  };

  return (
    <div className="tournament-schedule-container">
      <h1 className="schedule-title">Tournament Schedule</h1>
      <p className="schedule-detail">브래킷: {bracket}</p>
      <p className="schedule-detail">상태: {title}</p>
      <div className="button-container">
        <button className="start-button" onClick={startGame}>
          게임 시작
        </button>
        <button className="start-button" onClick={startGame}>
          게임 시작
        </button>
      </div>
    </div>
  );
};

export default TournamentSchedule;
