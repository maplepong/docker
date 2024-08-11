/* @jsx myReact.createElement */
import myReact, { Link } from "../core/myReact.js";
import api from "../core/Api.js";
import "../css/index.css";
import "../css/friend.css";

const RequestFriend = () => {
  // const [nickname, setNickname] = useState('');

  const handleClick = (event) => {
    event.preventDefault();
    const nicknameValue = document.getElementById("nicknameInput").value;
    const response = api.sendFriendRequest(nicknameValue);
  };

  return (
    <div id="requestFriend" style="align-items: left;">
      <form id="requestBox" style="display: flex; flex-direction: column;">
        <input type="text" id="nicknameInput" style="width: 10rem;" placeholder="닉네임 입력" />
        <button type="button" onClick={handleClick}>
          친구 요청 보내기
        </button>
      </form>
    </div>
  );
};

export default RequestFriend;
