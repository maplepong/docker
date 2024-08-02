/* @jsx myReact.createElement */
import myReact, { useEffect, Link } from "../../core/myReact";
import api from "../../core/Api";

const ResultGame = (gameResult) => {
  useEffect(async () => {
    await api.sendGameResult(gameResult).catch((err) => {
      alert(err);
    });
    console.log("게임 결과 전송 완료");
  });

  return (
    <div>
      <p>게임이 종료되었습니다.</p>
      <p>winner:{gameResult.winner}</p>
      <p>loser:{gameResult.loser}</p>
      <Link to="lobby">
        <button>로비로 이동</button>
      </Link>
    </div>
  );
};

export default ResultGame;
