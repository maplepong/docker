import { apiInstance } from "./Api.js";

const apiTounrament = {
  enter: function () {
    return apiInstance
      .post("tournament/new_tournament", {
        headers: {
          Authorization: `Bearer ${localStorage.accessToken}`,
        },
      })
      .then((res) => {
        console.log(res);
        if (res.status === 201) {
          //방장
          return {players: [localStorage.getItem("nickname")], status: res.status};
        } else  {
          const temp = [];
          res.data.participants.forEach((player) => {
            temp.push(player.nickname);
          });
          return {players: temp, status: res.status};
        }
      })
      .catch((error) => {
        if (error.response?.status === 409) {
          this.out(); // 퇴장 후 엔터
          console.log("재입장합니다");
          return this.enter();
        } else throw error;
      });
  },
  out: async () => {
    return await apiInstance
      .request({ method: "DELETE", url: "tournament/out_tournament" })
      .then((res) => {
        console.log(res);
      })
      .catch((err) => {
        console.log(err);
      });
  },
  start_semifianl: async function () {
    return await apiInstance
      .request({ method: "POST", url: "tournament/start_semifinal" })
      .then((res) => {
        console.log(res);
        return res;
      })
      .catch((err) => {
        console.log(err);
        return err;
      });
  }
};

export default apiTounrament;
