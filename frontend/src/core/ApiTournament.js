import { apiInstance } from "./Api.js";

const apiTounrament = {
  enter: async () => {
    return await apiInstance
      .post("tournament/new_tournament", {
        headers: {
          Authorization: `Bearer ${localStorage.accessToken}`,
        },
      })
      .then((res) => {
        console.log(res);
        if (res.status === "201") {
          //방장
          return [localStorage.getItem("nickname")];
        } else if (res.status === "200") {
          const temp = [];
          res.data.participants.forEach((player) => {
            temp.push(player.nickname);
          });
          return temp;
        } else if (res.status === "409") {
          this.out(); // 퇴장 후 엔터
          console.log("재입장합니다");
          return this.enter(); //
        }
      })
      .catch((error) => {
          if (axios.isAxiosError(error) && error.response?.status === 409){
            this.out(); // 퇴장 후 엔터
            console.log("재입장합니다");
            return this.enter();
          }
         else throw error;
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
    atch((err) => {
      console.log(err);
    });
  },
};

export default apiTounrament;
