import { apiInstance } from "./Api.js";

const requestGameInfo = async (gameId) => {
  var result = null;
  return await apiInstance
    .request({
      headers: {
        Authorization: `Bearer ${localStorage.accessToken}`,
      },
      method: "GET",
      url: `game/game_info/${gameId}`,
    })
    .then((response) => {
      result = response;
      console.log("Response:", response);
      return result;
    })
    .catch((error) => {
      console.error("Error:", error);
      return null;
    });
};

const requestJoinGame = async (gameId, password) => {
  var result = null;
  const formData = new FormData();
  formData.append("id", gameId);
  if (password) formData.append("password", password);
  return await apiInstance
    .post("game/enter", formData, {
      headers: {
        Authorization: `Bearer ${localStorage.accessToken}`,
      },
    })
    .then((response) => {
      result = response;
      console.log("Response:", response);
      return result;
    })
    .catch((error) => {
      console.error("Error:", error);
      return error.response;
    });
};

const requestLobbyList = async () => {
  var result = null;
  console.log("request Lobby List");
  return await apiInstance
    .request({
      headers: {
        Authorization: `Bearer ${localStorage.accessToken}`,
      },
      method: "GET",
      url: "game/get_game_list",
    })
    .then((response) => {
      result = response;
      console.log("Response:", response);
      return result.data.games;
    })
    .catch((error) => {
      console.error("Error:", error);
      return null;
    });
};

const requestCreateGame = async (room_title, password) => {
  var result = null;
  console.log("room_title: ", room_title, "password: ", password);
  console.log("token??? : ", localStorage.accessToken);
  const formData = new FormData();
  formData.append("room_title", room_title);
  formData.append("password", password);
  console.log("request Create Game");
  return await apiInstance
      .post("game/new", formData, {
        headers: {
          Authorization: `Bearer ${localStorage.accessToken}`,
        },
      })
      .then((response) => {
        if (typeof result === "undefined" || result.status != 201) {
          console.log("room create Error");
        console.log(result);
        return;}
        result = response;
        console.log("Response:", response);
      })
      .catch((error) => {
        console.error("Error create game room:", error);
      });
};

const requestExitGame = async (gameId) => {
  var result = null;
  return await apiInstance
    .delete(`game/exit/${gameId}`, {
      headers: {
        Authorization: `Bearer ${localStorage.accessToken}`,
      },
    })
    .then((response) => {
      result = response;
      console.log("Response:", response);
      return result;
    })
    .catch((error) => {
      console.error("Error:", error);
      return null;
    });
};

export {
  requestLobbyList,
  requestCreateGame,
  requestGameInfo,
  requestJoinGame,
  requestExitGame,
};