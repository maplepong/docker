/* @jsx myReact.createElement */
import myReact, { useEffect, Link } from "../../core/myReact";
import api from "../../core/Api";

const ResultGame = (gameResult) => {
  useEffect(async () => {
    if (gameResult.gameResult.isUserWin == true) {
        await api.sendGameResult(gameResult).catch((err) => {
          alert(err);
        });
    }
  });

  return (
    <div>
      <p>게임이 종료되었습니다.</p>
      <p>winner:{gameResult.gameResult.winner}</p>
      <p>loser:{gameResult.gameResult.loser}</p>
        <button onclick={() => myReact.redirect("lobby")}>로비로 이동</button>
    </div>
  );
};

export default ResultGame;
