import { request42ApiLogin, requestApiSignup } from "./oldApi";
import myReact from "./myReact";
import axios from "axios";

const apiInstance = axios.create({
  baseURL: "https://localhost/api/",
  headers: {
    "Content-Type": "application/json",
  },
  timeout: 5000,
  withCredentials: true, //develope
}); //정리 필요

function getCookie(name) {
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) return parts.pop().split(";").shift();
}

apiInstance.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    if (!error.response || !error.response.status) return Promise.reject(error);
    if (!error.response) {
      // It's a network error
      if (!originalRequest._retry) {
        originalRequest._retry = true;
        console.log("Network error - retrying...");
        return apiInstance.request(error.config);
      }
      return Promise.reject(error);
    }
    if (error.response.status === 401) {
      //token err
      console.log("401::trying refresh");
      if (!originalRequest._retry) {
        originalRequest._retry = true;
        console.log("cookie : ", document.cookie);
        const response = await apiInstance
          .request({
            method: "POST",
            url: "user/api/token/refresh",
            headers: {
              "X-CSRFToken": getCookie("csrftoken"),
            },
          })
          .then((res) => {
            const accessToken = res.data.access_token;
            console.log("refreshed token: ", accessToken);
            localStorage.setItem("accessToken", accessToken);
            apiInstance.defaults.headers.common[
              "Authorization"
            ] = `Bearer ${res.data.access_token}`;
            originalRequest.headers[
              "Authorization"
            ] = `Bearer ${res.data.access_token}`;
            return apiInstance.request(originalRequest);
          })
          .catch((err) => {
            console.log("refresh token error", err);
            localStorage.clear();
            myReact.redirect("/");
            alert("로그인이 만료되었습니다");
            return err;
          });
      }
    } else {
      return Promise.reject(error);
    }
  }
);

function setToken() {
  if (localStorage.accessToken) {
    apiInstance.defaults.headers.common[
      "Authorization"
    ] = `Bearer ${localStorage.accessToken}`;
  }
}

const api = {
  testRefresh() {
    return apiInstance
      .request({
        method: "POST",
        url: "user/api/token/refresh",
        headers: {
          "X-CSRFToken": getCookie("csrftoken"),
        },
      })
      .then((res) => {
        const accessToken = res.data.access_token;
        console.log("refreshed token: ", accessToken);
        localStorage.setItem("accessToken", accessToken);
        apiInstance.defaults.headers.common[
          "Authorization"
        ] = `Bearer ${res.data.access_token}`;
      })
      .catch((err) => {
        console.log(err);
        console.log("refresh token error", err);
        localStorage.clear();
        myReact.redirect("/");
        alert("로그인이 만료되었습니다");
        return;
      });
  },
  login(getInfo) {
    const [username, password] = getInfo();
    return apiInstance
      .request({
        headers: {
          "X-CSRFToken": getCookie("csrftoken"),
          "Content-Type": "multipart/form-data",
        },
        method: "POST",
        url: "user/login",
        data: {
          username: username,
          password: password,
        },
      })
      .then((response) => {
        if (response.status === 200) {
          localStorage.setItem("username", username);
          localStorage.setItem("nickname", response.data.nickname);
          localStorage.setItem("accessToken", response.data.access_token);
          apiInstance.defaults.headers.common[
            "Authorization"
          ] = `Bearer ${response.data.access_token}`;
        }
        return response;
      })
      .catch((error) => {
        return error;
      });
  },
  request42ApiLogin(code) {
    if (code === null) {
      console.log("failed to get Code");
      return;
    }
    // console.log("Code", code);
    return apiInstance
      .request({
        headers: {
          "X-CSRFToken": getCookie("csrftoken"),
          "Content-Type": "multipart/form-data",
        },
        url: "user/api-login",
        method: "POST",
        data: {
          code: code,
        },
      })
      .then((response) => {
        if (response.status === 202) {
          const username = response.data.id;
          console.log("id: " + username, "님은 회원가입 필요");
          const signupResponse = localStorage.setItem("username", username);
          myReact.redirect("api-signup");
          return signupResponse;
        } else if (response.status === 200) {
          console.log(response.data.username);
          const username = response.data.username;
          localStorage.setItem("username", username);
          localStorage.setItem("nickname", response.data.nickname);
          localStorage.setItem("accessToken", response.data.access_token);
          axios.defaults.headers.common["Authorization"] =
            response.data.access_token;
          console.log("이미 있는 회원입니당");
          myReact.redirect("home");
          console.log(localStorage.getItem("accessToken"));
          console.log(localStorage.getItem("nickname"));
          return response;
        }
      })
      .catch((error) => {
        console.log("42 API LOGIN ERROR", error);
        return error;
      });
  },
  requestApiSignup(username, nickname) {
    return apiInstance
      .request({
        headers: {
          "X-CSRFToken": getCookie("csrftoken"),
          "Content-Type": "multipart/form-data",
        },
        url: "user/api-signup",
        method: "POST",
        data: {
          id: username,
          nickname: nickname,
        },
      })
      .then((response) => {
        console.log("API SIGNUP: ", response);
        return response;
      })
      .catch((error) => {
        console.log("API SIGNUP ERROR: ", error);
        return error;
      });
  },
  sendEmailVerifyPin(_email) {
    return apiInstance
      .request({
        headers: {
          "X-CSRFToken": getCookie("csrftoken"),
        },
        method: "POST",
        url: "user/generate_email_pin",
        data: {
          email: _email,
        },
      })
      .then((response) => {
        console.log(response);
        return response;
      })
      .catch((error) => {
        console.log(error);
        return error;
      });
  },
  otpVerifyPin(_username, _pin) {
    console.log(_username, _pin);
    return apiInstance
      .request({
        headers: {
          "X-CSRFToken": getCookie("csrftoken"),
        },
        method: "POST",
        url: "user/otp_verify",
        data: {
          username: _username,
          otp: _pin,
        },
      })
      .then((response) => {
        console.log(response);
        return response;
      })
      .catch((error) => {
        console.log(error);
        return error;
      });
  },
  checkEmailVerifyPin(_email, _pin) {
    console.log("YOUR EMAIL", _email, "YOUR PIN", _pin);
    return apiInstance
      .request({
        headers: {
          "X-CSRFToken": getCookie("csrftoken"),
        },
        method: "POST",
        url: "user/verify_pin",
        data: {
          email: _email,
          pin: _pin,
        },
      })
      .then((response) => {
        console.log(response);
        return response;
      })
      .catch((error) => {
        console.log(error);
        return error;
      });
  },
  sendFriendRequest(nickname) {
    setToken();
    return apiInstance
      .request({
        method: "POST",
        url: "user/friend/" + nickname,
      })
      .then((response) => {
        // console.log(nickname + "에게 친구 요청함")
        if (response.status === 201) {
          alert(response.data.to_user + "님에게 친구신청이 완료되었습니다.");
          return response;
        }
      })
      .catch((error) => {
        if (error.response.status === 409) {
          alert("이미 친구신청된 유저입니다.");
          return error;
        }
        alert(`문제가 발생했습니다.\nERRORCODE::`, error.response.status);
        return error;
      });
  },
  handleFriendRequest(nickname, type) {
    //type ==="POST", "DELETE"
    setToken();
    return apiInstance
      .request({
        method: type,
        url: "user/friend-request/" + nickname,
      })
      .then((response) => {
        console.log(nickname + "의 친구 요청을 " + type + "하였습니다.");
        return response.status;
      })
      .catch((error) => {
        return error;
      });
  },
  deleteFriend(nickname) {
    setToken();
    return apiInstance
      .request({
        method: "DELETE",
        url: "user/friend/" + nickname,
      })
      .then((response) => {
        console.log(nickname + "(와)과 더 이상 친구가 아닙니다.");
        return response.status;
      })
      .catch((error) => {
        return error;
      });
  },
  logout() {
    //not on api list
    localStorage.removeItem("username");
    localStorage.removeItem("nickname");
    localStorage.removeItem("accessToken");
    apiInstance.defaults.headers.common["Authorization"] = null;
    apiInstance.defaults.withCredentials = true;
    alert("로그아웃되었습니다");
    myReact.redirect("/");
  },
  getFriendList() {
    setToken();
    return apiInstance
      .request({
        method: "GET",
        url: "user/friend-list",
      })
      .then((response) => {
        console.log(response);
        return response.data;
      })
      .catch((error) => {
        return error;
      });
  },
  getRequestFriendList() {
    setToken();
    return apiInstance
      .request({
        method: "GET",
        url: "user/friend-request-list",
      })
      .then((response) => {
        // console.log(response);
        return response.data;
      })
      .catch((error) => {
        return error;
      });
  },
  signup(username, password, nickname, mail) {
    // setToken(); // 없어도 된다.
    const formData = new FormData();
    console.log("INFO", username, password, nickname, mail);
    formData.append("username", username);
    formData.append("nickname", nickname);
    formData.append("password", password);
    formData.append("email", mail);
    return apiInstance
      .request({
        method: "POST",
        url: "user/sign-up",
        data: formData,
        headers: {
          "X-CSRFToken": getCookie("csrftoken"),
          "Content-Type": "multipart/form-data",
        },
      })
      .then((response) => {
        console.log(response);
        console.log(username, "의 회원가입 완료!");
        return response;
      })
      .catch((error) => {
        console.error("Error: ", error.response);
        return error.response;
      });
  },
  validCheck(type, value) {
    setToken();
    return apiInstance
      .request({
        method: "GET",
        url: "user/valid-check?type=" + type + "&value=" + value,
      })
      .then((response) => {
        console.log(value, " 값은 ", type, " 값으로 적합하다");
        return response;
      })
      .catch((error) => {
        if (!error.response || !error.response.status) return error;
        if (error.response.status === 409) {
          console.log(value, " 값은 ", type, " 할수없다.. 중복되었다");
        } else {
          console.log(value, " 값은 ", type, " 할수없다.. 요청에 문제가 있다");
        }
        return error;
      });
  },
  getUserInfomation(nickname) {
    setToken();
    console.log("정보를 요청한 닉네임: ", nickname);
    return apiInstance
      .request({
        method: "GET",
        url: "user/information?nickname=" + nickname,
      })
      .then((response) => {
        console.log(nickname + "의 정보를 불러왔습니다.");
        console.log(typeof response.data, response.data);
        return response.data;
      })
      .catch((error) => {
        console.log("에러!!");
        return error;
      });
  },
  patchUserInfomation(flag, changedValue) {
    //409 conflict
    setToken();
    console.log(flag);
    console.log(localStorage.nickname);
    console.log(changedValue);
    const formData = new FormData();
    if (flag === 1) {
      formData.append("introduction", changedValue);
    } else if (flag === 2) {
      formData.append("nickname", changedValue);
      localStorage.nickname = changedValue;
      console.log("바꼈냐?", localStorage.nickname);
    }
    return apiInstance
      .request({
        method: "PATCH",
        url: "user/information",
        data: formData,
        headers: {
          "Content-Type": "application/json",
        },
      })
      .then((response) => {
        console.log(localStorage.nickname + "의 정보를 변경했습니다.");
        return response.data;
      })
      .catch((error) => {
        console.log(localStorage.nickname + "의 정보를 변경하지 못했습니다.");
        return error;
      });
  },
  userImage(type, src, nickname) {
    setToken();
    if (nickname) {
      if (type === "POST") {
        if (!src) {
          console.error("api image post:: no image provided");
          return false;
        }
        const formData = new FormData();
        formData.append("image", src);
        return apiInstance
          .request({
            method: type,
            url: "user/image/" + nickname,
            data: formData,
            headers: {
              //develope
              "Content-Type": "multipart/form-data",
            },
          })
          .then((response) => {
            console.log("사진을 올렸다");
            return response;
          })
          .catch((error) => {
            console.log("사진을 올리지 못했다...");
            return error;
          });
      }
      if (type !== "GET") return Error("권한을 벗어난 요청입니다.");
      return apiInstance
        .request({
          method: type,
          url: "user/image",
        })
        .then((response) => {
          console.log("사진을 " + type + " 했다");
          return response.data;
        })
        .catch((error) => {
          console.log("사진을 " + type + " 하지 못했다...");
          return error;
        });
      return apiInstance
        .request({
          method: type,
          url: "user/image/" + nickname,
        })
        .then((response) => {
          console.log(nickname + "의 사진을 " + type + "했습니다.");
          return response.data;
        })
        .catch((error) => {
          console.log(nickname + "의 사진을 " + type + "하지 못했습니다.");
          return error;
        });
    }
  },
  inviteToGame(roomId, nickname) {
    return apiInstance
      .request({
        url: "game/invite",
        method: "POST",
        data: {
          id: roomId,
          nickname: nickname,
        },
      })
      .then((res) => {
        if (res.status === 201) {
          alert(res, "초대되었습니다.");
        }
        return res;
      })
      .catch((err) => {
        switch (err.response.status) {
          case 404:
            alert("게임이 없습니다. 없단 말입니다."); // 상대 유저가 없을 경우도 있지만 보통은 nicknameModal에서 소환할 것. 문제 있으면 백엔드에 분기요청하시오
            break;
          case 400:
            alert(
              `초대할 수 없습니다.\n1. 이미 게임방에 있는 유저거나\n2. 스스로 초대했거나\n3. 둘 다일 수 있습니다.`
            );
            break;
          case 403:
            alert("방이 풀방입니다.");
            break;
          default:
            alert("문제가 생겼습니다.");
            console.log(err);
        }
        return err;
      });
  },
  async sendGameResult(result) {
    console.log("sendGameResult", result.gameResult);
    console.log("sendGameResult", result.gameResultloser);

    const formData = new FormData();
    formData.append("game_id", result.gameResult.game_id);
    formData.append("winner_nickname", result.gameResult.winner);
    formData.append("loser_nickname", result.gameResult.loser);
    formData.append("winner_score", result.gameResult.winner_score);
    formData.append("loser_score", result.gameResult.loser_score);

    console.log(formData.keys());
    return await apiInstance
      .request({
        url: "game/update_game_result",
        method: "POST",
        data: formData,
      })
      .then((res) => {
        if (res.status === 201) {
          alert(res, "게임결과송신완료.");
        }
        return res;
      })
      .catch((error) => {
        console.log("게임결과송신실패");
        return error;
      });
  },
  gameExit(roomId) {
    return apiInstance
      .request({
        url: "game/exit",
        method: "DELETE",
        data: {
          id: roomId,
        },
      })
      .then((res) => {
        if (res.status === 200) {
          alert("게임방을 나갔습니다.");
        }
        return res;
      })
      .catch((error) => {
        console.log("게임방을 나가지 못했습니다.");
        return error;
      });
  },
  getGameRecord() {
    setToken();
    return apiInstance
      .request({
        method: "GET",
        url: "user/game-record",
      })
      .then((response) => {
        console.log("게임기록을 불러왔습니다.");
        return response;
      });
  },
};

export { apiInstance };

export default api;
