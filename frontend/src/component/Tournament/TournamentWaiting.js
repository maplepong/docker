/* @jsx myReact.createElement */
import myReact, { useEffect, useState } from "../../core/myReact.js";
// import api from "../../Api.js";
// import router from "../../Router.js";
// import GameList from "../Game/GameList.js";
import socketController from "../../core/socket.js";

import "../../css/tournament.css";
import { api, apiInstance } from "../../core/Api.js";
import apiTounrament from "../../core/ApiTournament.js";
import Loading from "../Loading.js";

const TournamentWaiting = ({ handleStartGame, players, host, gameStarted }) => {
  const [tournamentState, setTournamentState] = myReact.useGlobalState("tournamentState", {});

  const outTournament = async () => {
    socketController.sendMessage({ type: "tournament_out" });
    await apiTounrament.out();
    myReact.redirect("home");
  }

  const handlePopState = async (e) => {
    document.location.includes("tournament") ? null : await outTournament();
    document.removeEventListener("popstate", handlePopState);
  }



  useEffect(async () => {
    document.addEventListener("popstate", handlePopState); 
    try {
      const data = await apiTounrament.enter();
      tournamentState.players = [];
      tournamentState.host = data.host;
      setTournamentState({players: data.participants, host: data.host});
      socketController.initSocket();
      socketController.sendMessage({ type: "tournament_in" });
      socketController.setSocketTypes([
        {
          type: "tournament_in",
          func: 
            (data) => {
              console.log("playerJoined", data);
              if (tournamentState.players && tournamentState.players.includes(data.nickname)) {
                console.log(...players, data.nickname, "player alreay exists");
                return;
              }
              if (data.nickname !== localStorage.getItem("nickname")) 
              tournamentState.players.push(data.nickname);
              setTournamentState(tournamentState);
            }
        },
        {
          type: "tournament_out",
          func: (data) => {
            console.log("playerOut", data);
            const idx = tournamentState.players.indexOf(data.nickname);
            if (idx === -1) {
              console.log(data.nickname, "player not exists");
              return;
            }
            tournamentState.players.splice(idx, 1);
            setTournamentState(tournamentState);
          }
        },
        {
          type: "tournament_start",
          func: async () => {
            await apiInstance
              .get("tournament/get_bracket")
              .then((res) => {
                console.log(res.data);
                tournamentState.bracket = res.data.bracket;
                tournamentState.gameId = res.data.myGameid;
                setTournamentState(tournamentState);
              })
              .catch(async (err) => {
                alert(err);
                await outTournament();
              });}
        },
        {
          type: "tournament-host-change",
          func: function (data) {
            console.log("hostChange", data);
            tournamentState.host = data.nickname;
            setTournamentState(tournamentState);
          },
        },
      ])
    } catch (err) {
      alert(err);
      await outTournament();
    }
    return () => {
      document.removeEventListener("popstate", handlePopState);
    }
  }, []);

  return (tournamentState && tournamentState.host ? (
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
              {tournamentState?.players ? tournamentState?.players.map((player, index) => (
                <span key={index} className="users">
                  <p>{player}</p>
                </span>
              )) : <p>"error"</p>}
            </div>
          </div>
          <div>
            <div>주최자: {tournamentState.host}</div>
            <div>최대 인원: 4명</div>
             {localStorage.getItem("nickname") === tournamentState.host ? (<div>
                <button onClick={handleStartGame}>시작하기</button>
              </div>)
            : null}
              <button onClick={outTournament}>나가기</button>
          </div>
        </div>
      </div>
    </div>)
    : <Loading type="tournament"/>
  );
};

export default TournamentWaiting;
