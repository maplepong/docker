/* @jsx myReact.createElement */
import myReact, { useEffect, useState, useRef } from "../../core/myReact.js";

const TournamentFinished = ({ tournamentResult, outTournament }) => {
  return (
    <div>
      <h1>토너먼트 종료</h1>
      <h2>우승자: {tournamentResult.winner}</h2>
      <h2>준우승자: {tournamentResult.loser}</h2>
      <p>
        축하합니다!{" "}
        {tournamentResult.winner === localStorage.getItem("nickname")
          ? "우승하셨습니다."
          : "준우승하셨습니다."}
      </p>
      <button onClick={outTournament}>메인으로 돌아가기</button>
    </div>
  );
};
export default TournamentFinished;
