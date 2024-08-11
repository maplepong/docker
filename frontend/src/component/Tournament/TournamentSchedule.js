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

  // mock data
  // const gameId = 543;
  // const gameResult = { winner: "test1", loser: "test2" };
  // const status = "final";
  // const bracket = {semifinal: ["test1", "test2", "test3", "test4"], final: ["test1", "test2"]};
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
    <div class="tournament-schedule-container">
      <h1 class="schedule-title">Tournament Schedule</h1>

      <div class="bracket-container">
        {status === "final" ? (
          <div class="bracket-round">
            <p class="round-title">결승 대진표</p>
            <div class="match">
              <p class="player">{bracket.final[0]}</p>
              <span class="versus">vs</span>
              <p class="player">{bracket.final[1]}</p>
            </div>
          </div>
        ) : (
          ""
        )}
        <div class="bracket-round">
          <p class="round-title">준결승 대진표</p>
          <div>
            <div key={0} class="match">
              <p class="player">{bracket.semifinal[0]}</p>
              <p class="versus">vs</p>
              <p class="player">{bracket.semifinal[1]}</p>
            </div>
            <div key={1} class="match">
              <p class="player">{bracket.semifinal[2]}</p>
              <p class="versus">vs</p>
              <p class="player">{bracket.semifinal[3]}</p>
            </div>
          </div>
        </div>
      </div>

      {tc.getStatus() === 3 && <p class="schedule-detail">"{statusMessage}"</p>}
      <p class="schedule-detail">게임 ID: {tc.getGameId()}</p>
      <p class="schedule-detail">
        상태: {title} {tc.getStatus()}
      </p>

      <div class="button-container">
        <button class="start-button" onClick={() => startGame()}>
          게임 시작
        </button>
      </div>
    </div>
  );
};

export default TournamentSchedule;
