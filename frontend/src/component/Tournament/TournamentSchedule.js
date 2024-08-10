/* @jsx myReact.createElement */
import { requestJoinGame } from "../../core/ApiGame.js";
import myReact, { useEffect, useState } from "../../core/myReact.js";
import "../../css/tournament/tournament_schedule.css";
import tc from "./TournamentController.js";
import socketController from "../../core/socket.js";
import apiTounrament from "../../core/ApiTournament.js";

const TournamentSchedule = () => {
  const gameId = tc.getGameId();
  const gameResult = tc.getResult();
  const status = tc.getStatus() === 2 ? "semifinal" : "final";
  const bracket = tc.getBracket();
  console.log("bracket", bracket, tc.getBracket());
  const title = tc.getStatus() === 2 ? "준결승전" : "결승전";
  if (tc.getStatus() === 3) {
    bracket.final.push(localStorage.getItem("nickname"));
  }
  const [statusMessage, setStatusMessage] = useState(
    "준결승전 경기 진행중 : 다음 경기를 기다리세요. 채팅을 확인하세요"
  );

  const startGame = async () => {
    console.log(startGame);
    await requestJoinGame(gameId, "").catch((err) => {
      return alert(err.response.data.message || err.message || err);
    });
    myReact.redirect(`tournament/${status}/${gameId}`);
  };

  useEffect(async () => {
    if (tc.getStatus() === 3) {
      console.log("between round");

      if (gameResult.loser === localStorage.getItem("nickname")) {
        socketController.sendMessage({ type: "tournament_out" });
        alert("세미 파이널에서 탈락하셨습니다.");
        tc.outTournament("tournament_end");
      } else {
        // socketController.sendMessage({
        //   type: "tournament_end",
        //   status: "tournament_semifinal_end",
        // }); //백엔드 쪽 수정 필요
        try {
          const res = await apiTounrament.end_semifinal(gameResult);
          console.log("onSemifinalEnd", res);
          alert(res.message);
          tc.setInfo({ gameId: res.final_game_id });
          // 메시지로 판단하여 두 팀 다 끝났을 경우에만 웹소켓 전송
          if (res.message === "Final game set up.") {
            socketController.sendMessage({
              type: "tournament_end",
              status: "tournament_semifinal_end",
            });
            setStatusMessage("준결승전 경기 완료 : 결승전을 시작하세요");
          } else {
            setStatusMessage(
              "준결승전 경기 진행중 : 다음 경기를 기다리세요. 채팅을 확인하세요"
            );
          }
        } catch (err) {
          alert(err);
          tc.outTournament();
        }
      }
    }
  }, []);

  return (
    <div className="tournament-schedule-container">
      <h1 className="schedule-title">Tournament Schedule</h1>
      <p className="schedule-detail">준결승 대진표: {bracket.semifinal}</p>
      <p className="schedule-detail">결승 대진표: {bracket.final}</p>
      {tc.getStatus() === 3 ? (
        <p className="schedule-detail">"{statusMessage}"</p>
      ) : (
        ""
      )}
      <p className="schedule-detail">게임 ID: {tc.getGameId()}</p>
      <p className="schedule-detail">
        상태: {title}
        {tc.getStatus()}
      </p>
      <div className="button-container">
        <button className="start-button" onClick={() => startGame()}>
          게임 시작
        </button>
        <button className="start-button" onClick={() => startGame()}>
          게임 시작
        </button>
      </div>
    </div>
  );
};

export default TournamentSchedule;
