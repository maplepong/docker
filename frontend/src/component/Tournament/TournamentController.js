import myReact, { useEffect } from "../../core/myReact";
import apiTounrament from "../../core/ApiTournament";
import socketController from "../../core/socket";
import api from "../../core/Api";

export const status = {
  LOADING: 0,
  READY: 1,
  STARTED: 2,
  ROUNED_ONE: 3,
  BETWEEN_ROUND: 4,
  ROUNED_TWO: 5,
  FINISHED: 6,
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
    initTournamentSocket: function ({ setPlayers, setHost }) {
      useEffect(() => {
        this.sc.initSocket();
        this.sc.setSocketTypes([
          // 시작전 유저 입장
          {
            type: "tournament_in",
            func: function (data) {
              if (setPlayers) setPlayers(onPlayerJoined(data));
            },
          },
          // 시작전 유저 퇴장
          {
            type: "tournament_out",
            func: function (data) {
              if (setPlayers) setPlayers(onPlayerLeft(data));
            },
          },
          // 토너먼트 시작
          {
            type: "tournament_start",
            func: function (data) {
              onTournamentStart(data);
            },
          },
          //host 변경
          {
            type: "tournament_host_change",
            func: function (data) {
              if (setHost) setHost(onHostChange(data));
            },
          },
        ]);
      });
    },
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
        case status.STARTED:
        case status.BETWEEN_ROUND: {
          myReact.redirect("tournament/schedule");
          break;
        }
        case status.ROUNED_ONE: {
          myReact.redirect("tournament/semifinal" + this._gameId);
          break;
        }
        case status.ROUNED_TWO: {
          myReact.redirect("tournament/final" + this._gameId);
          break;
        }
        case status.FINISHED: {
          outTournament("tournament_end");
          break;
        }
      }
      this._status = this._status + 1;
    },
    onPlayerJoined: function (data) {
      console.log("playerJoined", data);
      if (this._players.includes(data.nickname)) {
        console.log(...this._players, data.nickname, "player alreay exists");
        return;
      }
      this._players.push(data.nickname);
      return this._players;
    },
    onPlayerLeft: function (data) {
      const idx = this._players.indexOf(data.nickname);
      if (idx === -1) {
        return;
      }
      this._players.splice(idx, 1);
      console.log("player left:", players);
      return this._players;
    },
    onHostChange: function (data) {
      console.log("Host changed to:", data.new_host);
      this._host = data.new_host;
      return this._host;
    },
    onTournamentStart: async function (data) {
      await apiInstance
        .get("tournament/get_bracket")
        .then((res) => {
          console.log(res.data);
          this._gameId = res.data.myGameid;
          this._bracket = res.data.bracket;
          this.nextStatus();
        })
        .catch((err) => {
          alert(err);
          outTournament();
        });
    },
    setInfo: function ({ host, players, bracket, result, status, gameId }) {
      this._host = host || this._host;
      this._players = players || this._players;
      this._bracket = bracket || this._bracket;
      this._result = result || this._result;
      this._status = status || this._status;
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
