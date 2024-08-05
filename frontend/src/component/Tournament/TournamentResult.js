/* @jsx myReact.createElement */
import myReact, { useEffect, useState, useRef } from "../../core/myReact.js";
import apiTounrament from "../../core/ApiTournament.js";

const TournamentResult = () => {
  const [gameResult, setGameResult] = myReact.useGlobalState(
    "gameResult",
    null
  );
  useEffect(() => {
    if (gameResult) {
      console.log("gameResult", gameResult);
      // apiTounrament.
    }
  });

  return (
    <div id="tournament-result-container">
      <div id="tournament-result">
        <p>id: {gameResult.game_id}</p>
        <p>winner: {gameResult.winner}</p>
        <p>loser: {gameResult.loser}</p>
        <p>status: {gameResult.isUserWin ? "이김" : "짐"}</p>
        <p>{`${gameResult.winner_score} : ${gameResult.loser_score}`}</p>
      </div>
    </div>
  );
};

export default TournamentResult;
