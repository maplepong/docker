/* @jsx myReact.createElement */
import api from "../core/Api.js";
import myReact, { useEffect, useState } from "../core/myReact.js";
import "../css/match.css";

const Matchhistory = (props) => {

  const [gameRecords, setGameRecords] = useState([]);
  const [stats, setStats] = useState({
    winCount: 0,
    loseCount: 0,
    winRate: 0,
    rival: "None",
  }); // 하나의 상태로 관리

  useEffect(async () => {
    {
      const response = await api.getGameRecord();
      if (response && response.data && response.data.game_records) {
        const records = response.data.game_records;
        setGameRecords(records);

        // '승'과 '패'의 개수를 세고 승률을 계산하는 로직

        const { winCount, loseCount } = records.reduce(
          (acc, record) => {
            if (record.result === "승") {
              acc.winCount += 1;
            } else if (record.result === "패") {
              acc.loseCount += 1;
            }
            return acc;
          },
          { winCount: 0, loseCount: 0 }
        );

        const totalGames = winCount + loseCount;
        const winRate = totalGames > 0 ? (winCount / totalGames) * 100 : 0;
        const rivalData = await api.getRival();

        // 상태 업데이트
        const tempstats = {
          winRate: winRate,
          rival: rivalData,
          winCount: winCount,
          loseCount: loseCount,
        };
        setStats(tempstats);

      } else {
        console.error("No data returned from API");
      }
    }
  }, []);

  return (
    <div id="matchbox" style="width:100%; height:100%;">
      <div style="margin: 10px; font-size: 40px;"> 대전 기록 </div>
      <div style={{ display: "flex" }}>
        <div id="infobox">
          <div style="margin: 5px">
            <div style="display: flex; flex-direction: column; margin: 5px">
              <div>{localStorage.nickname}</div>
              <div>LV 42</div>
            </div>
          </div>
          <div
            style={{ display: "flex", flexDirection: "column", margin: "5px" }}
          >
            {/* <div className="myInfo">최신 토너먼트 등수 : 1등</div> */}
            {/* <div className="myInfo">미니게임 최장 생존: 1분 30초</div> */}
            <div className="myInfo">승률: {stats.winRate}%</div>
            <div className="myInfo">최다 라이벌 : {stats.rival}</div>
          </div>
        </div>
        <div id="Matcha">
          {gameRecords.length > 0 ? (
            gameRecords.slice(0, 5).map((record, index) => (
              <div key={index} style="margin: 10px;">
                <p id="Records">
                  <strong>Opponent</strong>{" "}
                  {record.opponent || "no opponent data"}
                </p>
                <p id="Records">
                  <strong>Your Score</strong> {record.user_score || "0"}
                </p>
                <p id="Records">
                  <strong>Opponent's Score</strong>{" "}
                  {record.opponent_score || "0"}
                </p>
                <p id="Records">
                  <strong>Result</strong> {record.result}
                </p>
                <p id="Records">
                  <strong>Game Date</strong> {record.game_date}
                </p>
              </div>
            ))
          ) : (
            <p>No game records available</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default Matchhistory;
