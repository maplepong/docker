import myReact, { useEffect } from "../../core/myReact";
import apiTounrament from "../../core/ApiTournament";
import socketController from "../../core/socket";
import api from "../../core/Api";

export const status = {
  // 컴포넌트
  LOADING: 0, // Loading
  READY: 1, // Waiting
  STARTED: 2, // Schedule
  ROUNED_ONE: 3, // gameroom
  BETWEEN_ROUND: 4, // schedule
  ROUNED_TWO: 5, // gameroom
  FINISHED: 6, // result
};

const createTournament = () => {
  return {
    _host: "",
    _players: [],
    _bracket: { semifinal: [], final: [] },
    _result: [],
    _status: status.LOADING,
    _gameId: null,
    sc: socketController,
    outTournament: async function (type) {
      this._status = status.LOADING;
      this._bracket = { semifinal: [], final: [] };
      if (type === "tournament_end") {
        alert("토너먼트가 종료되었습니다. 홈으로 돌아갑니다.");
      } else {
        await apiTounrament
          .out()
          .then((res) => {
            console.log(res);
            if (res.status === 200) {
              this.sc.sendMessage({ type: "tournament_out" });
            } else if (res.status === 202) {
              console.log("dfajskl");
              this.sc.sendMessage({ type: "tournament_host_change" });
              this.sc.sendMessage({ type: "tournament_out" });
            }
          })
          .catch((err) => {
            console.log(err);
          });

        myReact.redirect("home");
      }
    },
    nextStatus: function () {
      switch (this._status) {
        case status.LOADING: {
          myReact.redirect("tournament/loading");
        }
        case status.READY: {
          myReact.redirect("tournament/waiting");
          break;
        }
        case status.STARTED: {
          myReact.redirect("tournament/semifinal");
          break;
        }
        case status.BETWEEN_ROUND: {
          myReact.redirect("tournament/final");
          break;
        }
        case status.ROUNED_ONE: {
          myReact.redirect("tournament/semifinal/" + this._gameId);
          break;
        }
        case status.ROUNED_TWO: {
          myReact.redirect("tournament/final/" + this._gameId);
          break;
        }
        case status.FINISHED: {
          outTournament("tournament_end");
          break;
        }
      }
      this._status = this._status + 1;
    },

    setInfo: function ({ host, players, bracket, result, status, gameId }) {
      this._host = host || this._host;
      this._players = players || this._players;
      this._bracket = bracket || this._bracket;
      this._result = result || this._result;
      this._status = status || this._status;
      this._gameId = gameId || this._gameId;
      console.log("setInfo", this);
    },
    getPlayers: function () {
      return this._players;
    },
    getHost: function () {
      return this._host;
    },
    getBracket: function () {
      return this._bracket;
    },
    getResult: function () {
      return this._result;
    },
    getStatus: function () {
      return this._status;
    },
    getGameId: function () {
      return this._gameId;
    },
  };
};

const tournamentController = createTournament();

export default tournamentController;
