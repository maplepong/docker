/* @jsx myReact.createElement */
import myReact, { useEffect, Link } from "../../core/myReact.js";
import apiTounrament from "../../core/ApiTournament.js";
import socketController from "../../core/socket.js";

const TournamentResult = () => {
  const [gameResult, setGameResult] = myReact.useGlobalState(
    "gameResult",
    null
  );
  useEffect(async () => {
    if (gameResult.winner === localStorage.getItem("nickname")) {
      console.log("gameResult", gameResult);
      socketController.sendMessage({ type: "tournament_end" }); // 1. 둘중에 한명 2. api
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
    }
    socketController.sendMessage({ type: "tournament_out" }); // 둘다 해야함
  });

  return (
    <div id="tournament-result-container">
      <div id="tournament-result">
        <p>id: {gameResult.game_id}</p>
        <p>winner: {gameResult.winner}</p>
        <p>loser: {gameResult.loser}</p>
        <p>status: {gameResult.isUserWin ? "이김" : "짐"}</p>
        <p>{`${gameResult.winner_score} : ${gameResult.loser_score}`}</p>
        <Link to="home">돌아가기</Link>
      </div>
    </div>
  );
};

export default TournamentResult;
