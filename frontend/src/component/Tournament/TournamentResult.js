/* @jsx myReact.createElement */
import myReact, { useEffect, Link } from "../../core/myReact.js";
import apiTounrament from "../../core/ApiTournament.js";
import socketController from "../../core/socket.js";
import "../../css/tournament/tournament_result.css";
import tc from "./TournamentController.js";

const TournamentResult = () => {
  const gameResult = tc.getResult();
  useEffect(async () => {
    if (gameResult.winner === localStorage.getItem("nickname")) {
      console.log("gameResult", gameResult);
      await apiTounrament
        .end_tournament(gameResult)
        .then((res) => {
          console.log(res);
          return res;
        })
        .catch((err) => {
          alert(err);
          return err;
        });
      socketController.sendMessage({
        type: "tournament_end",
        winner_nickname: gameResult.winner,
      }); // 1. 둘중에 한명 2. api
    }
    socketController.sendMessage({ type: "tournament_out" }); // 둘다 해야함
  });

  return (
    <div id="tournament-result-container">
      <div id="tournament-result">
        <p className="result-title">Tournament 결과</p>
        <div className="result-item">
          <span className="result-label">ID:</span>
          <span className="result-value">{gameResult.game_id}</span>
        </div>
        <div className="result-item">
          <span className="result-label">Winner:</span>
          <span className="result-value">{gameResult.winner}</span>
        </div>
        <div className="result-item">
          <span className="result-label">Loser:</span>
          <span className="result-value">{gameResult.loser}</span>
        </div>
        <div className="result-item">
          <span className="result-label">Status:</span>
          <span className="result-value">
            {gameResult.isUserWin ? "이김" : "짐"}
          </span>
        </div>
        <div className="result-score">
          <span>{`${gameResult.winner_score} : ${gameResult.loser_score}`}</span>
        </div>
        <Link className="back-link" to="home">
          돌아가기
        </Link>
      </div>
    </div>
  );
};

export default TournamentResult;
