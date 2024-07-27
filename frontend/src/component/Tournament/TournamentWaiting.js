/* @jsx myReact.createElement */
import myReact, { useEffect, useState } from "../../core/myReact.js";
// import api from "../../Api.js";
// import router from "../../Router.js";
// import GameList from "../Game/GameList.js";
import "../../css/tournament.css";

const TournamentWaiting = ({handleStartGame, players, host, gameStarted}) => {
  
  console.log(players);
  console.log(host);
  return (
    <div>
      <div>
        <p>Tournament 이름</p>
        <div
          id="box"
          style={{
            display: "flex",
            flexDirection: "row",
            justifyContent: "center",
          }}
        >
          <div style={{ display: "block" }}>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              {players.map((player, index) => (
                <span key={index} className="users">
                  <img src="../css/img/logo.png" alt="User Avatar" />
                  <p>{player}</p>
                </span>
              ))}
            </div>
          </div>
          <div>
            <div>주최자: {host}</div>
            <div>최대 인원: 4명</div>
            <div>게임 상태: {gameStarted ? "게임 시작됨" : "대기 중"}</div>
            {!gameStarted && (
              <div>
                <button onClick={handleStartGame}>시작하기</button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default TournamentWaiting;
