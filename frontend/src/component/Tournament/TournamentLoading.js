/* @jsx myReact.createElement */
import myReact, { useEffect } from "../../core/myReact.js";
import tc from "./TournamentController";
import apiTounrament from "../../core/ApiTournament";
import Loading from "../Loading.js";
import socketController from "../../core/socket.js";

const TournamentLoading = () => {
  useEffect(async () => {
    try {
      const data = await apiTounrament.enter();
      let host, players;
      if (data.status !== 208) {
        socketController.sendMessage({ type: "tournament_in" });
      }
        host = data.host;
        players = data.players;
      tc.setInfo({ host, players });
      console.log("host sata", data);
      tc.nextStatus();
    } catch (err) {
      alert(err);
      console.log(err);
    }
  }, []);

  return (
    <div class="loadingConatiner">
      <Loading type="tournament" />
      <button onClick={() => tc.outTournament()}>취소하고 나가기</button>
    </div>
  );
};

export default TournamentLoading;
