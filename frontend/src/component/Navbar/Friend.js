/* @jsx myReact.createElement */
import myReact, { useEffect } from "../../core/myReact.js";
import "../../css/friend.css";
import api from "../../core/Api.js";

const Friend = ({type, nickname, status}) => {
  console.log("Friend", type, nickname);
  const [imagesrc, setImagesrc] = myReact.useGlobalState(nickname+"image", "asset/user/default-user.png");
  useEffect(() => {
    api.userImage("GET", null, nickname).then((res) => {
      console.log("getProfileImage", res.image);
      setImagesrc(res.image);
  }).catch((err) => {
    console.log("getProfileImage", err);
  })}, []);
  status = status ? status : false;

  return (
    <div id="friend-container">
      <div id="friend-notice"></div>
      <img id="friend-image" src={imagesrc}></img>
      <div id="friend-nickname">{nickname}</div>
      <div id="friend-status">{type}</div>
    </div>
  );
}

export default Friend;