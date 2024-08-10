/* @jsx myReact.createElement */
import myReact from "../../core/myReact.js";
import "../../css/tournament/tournament_schedule.css";

const TournamentSchedule = ({ bracket, status, startGame }) => {
  return (
    <div className="tournament-schedule-container">
      <h1 className="schedule-title">Tournament Schedule</h1>
      <p className="schedule-detail">브래킷: {bracket.current}</p>
      <p className="schedule-detail">상태: {status}</p>
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
