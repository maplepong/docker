/* @jsx myReact.createElement */
import myReact, { useEffect } from "../../core/myReact.js";
import "../../css/friend.css";
import api from "../../core/Api.js";
import NicknameModal from "../NicknameModal.js";

const statusTypes = {
  on: "접속중",
  off: "부재중",
  sending: "친구요청중",
  request: "친구해주세요",
};

const Friend = ({ type, nickname, status }) => {
  console.log("Friend types : ", type, nickname, status);
  const [imagesrc, setImagesrc] = myReact.useGlobalState(
    nickname + "image",
    "asset/user/default-user.png"
  );
  useEffect(async () => {
    await api
      .userImage("GET", null, nickname)
      .then((res) => {
        setImagesrc(res.image);
      })
      .catch((err) => {
        console.log("getProfileImage", err);
      });
  }, []);
  status = status ? status : false;

  return (
    <div id="friend-container">
      <div id="friend-notice">
        {status === "request" ? (
          <div class="request-button-container">
            <button
              class="inter"
              onClick={() => api.handleFriendRequest(nickname, "POST")}
            >
              수락
            </button>
            <button
              class="inter"
              onClick={() => api.handleFriendRequest(nickname, "DELETE")}
            >
              거절
            </button>
          </div>
        ) : (
          ""
        )}
      </div>
      <img id="friend-image" src={imagesrc}></img>
      <NicknameModal nickname={nickname} />
      <div id="friend-status">
        <p>{status ? statusTypes[status] : "업데이트중"}</p>
      </div>
    </div>
  );
};

export default Friend;
