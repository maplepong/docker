/* @jsx myReact.createElement */
import myReact, { useEffect, useState } from "../../core/myReact.js";
import HandleInviteModal from "../Navbar/HandelInviteModal.js";
import "../../css/tournament.css";
import "../../css/tournament/touranment_waiting.css"

const TournamentWaiting = ({ handleStartGame, players, host, gameStarted }) => {
  let show = true;
  useEffect(() => {
    setShow();
  }, []);
  const setShow = () => {
    const modal = document.getElementsByClassName("modalContainer")[0];
    if (!modal) return;
    show ? modal.classList.add("hidden") : modal.classList.remove("hidden");
    show = !show;
  };
  return (
    <div class="tournament-container">
  <div class="tournament-header">
    <p class="tournament-title">Tournament 이름</p>
    <div id="box" class="tournament-content">
      <div class="player-list">
        {players.map((player, index) => (
          <span key={index} class="users">
            {/* <img src={userImages.index} alt="User Avatar" /> */}
            <p>{player}</p>
          </span>
        ))}
      </div>
      <div class="tournament-details">
        <div>주최자: {host}</div>
        <div>최대 인원: 4명</div>
        <div>게임 상태: {gameStarted ? "게임 시작됨" : "대기 중"}</div>
        {!gameStarted && (
          <div class="start-button-container">
            <button class="start-button" onClick={handleStartGame}>시작하기</button>
          </div>
        )}
      </div>
    </div>
  </div>
  <button class="invite-button" onClick={() => setShow()}>초대하기</button>
  <HandleInviteModal setShow={() => setShow()} type="tournament" />
</div>

  );
};

export default TournamentWaiting;
