import myReact, { useEffect } from "../../core/myReact";
import apiTounrament from "../../core/ApiTournament";
import socketController from "../../core/socket";
import api from "../../core/Api";

export const status = {
  // 컴포넌트
  LOADING: 0, // Loading
  READY: 1, // Waiting
  STARTED: 2, // Schedule
  // ROUNED_ONE: 3, // gameroom
  BETWEEN_ROUND: 3, // schedule
  // ROUNED_TWO: , // gameroom
  FINISHED: 4, // result
};

const createTournament = () => {
  return {
    _host: "",
    _players: [],
    _bracket: { semifinal: [], final: [] },
    _result: [],
    _status: 0,
    _gameId: null,
    sc: socketController,
    outTournament: async function _out(type) {
      this.setInfo({
        host: "",
        players: [],
        bracket: { semifinal: [], final: [] },
        result: [],
        status: 0,
        gameId: null,
      });
      if (type === "tournament_end") {
        alert("토너먼트가 종료되었습니다. 홈으로 돌아갑니다.");
      } else {
        await apiTounrament
          .out()
          .then((res) => {
            if (res.status === 200) {
              socketController.sendMessage({ type: "tournament_out" });
            } else if (res.status === 202) {
              socketController.sendMessage({ type: "tournament_host_change" });
              socketController.sendMessage({ type: "tournament_out" });
            }
          })
          .catch((err) => {});
      }
      myReact.redirect("home");
    },
    nextStatus: function _next() {

      this._status = this._status + 1;
      switch (this._status) {
        case status.LOADING: {
          myReact.redirect("tournament/loading");
          break;
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
          myReact.redirect("tournament/result");
          // outTournament("tournament_end");
          break;
        }
      }
    },

    setInfo: function _set({ host, players, bracket, result, status, gameId }) {
      this._host = host || this._host;
      this._players = players || this._players;
      this._bracket = bracket || this._bracket;
      this._result = result || this._result;
      this._status = typeof status === "number" ? status : this._status;
      this._gameId = gameId || this._gameId;
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
