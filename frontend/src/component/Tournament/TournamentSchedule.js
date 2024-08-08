/* @jsx myReact.createElement */
import myReact from "../../core/myReact.js";

const TournamentSchedule = ({ braket, status, startGame }) => {
  return (
    <div>
      <h1> Tournament Schedule </h1>
      <p>braket : {braket}</p>
      <p>status : {status}</p>
      <button onclick={startGame}>게임시작</button>
      <button onclick={startGame}>게임시작</button>
    </div>
  );
};

export default TournamentSchedule;
