/* @jsx myReact.createElement */
import myReact, { Link } from "../core/myReact.js";
import { useState, useEffect } from "../core/myReact.js";
import "../css/friend.css";
import api from "../core/Api_.js";
import NicknameModal from "./NicknameModal.js";
import RequestFriend from "./RequestFriend.js";
// import { requestFriendList } from "../core/Api.js";
import socketController from "../core/socket";



const FriendList = (props) => {

  const [friendRequests, setFriendRequests] = useState({
		sends: [],
		receives: [],
	});
	
	const [friendlist, setFriendList] = useState([]);
  
  const onConnect = (data) => {
    console.log("ws connnected data :", data.friends);
    setFriendList(data.friends);
  };
  const onUpdate = (data) => {
    console.log("ws update data :", data);
    data.status = data.status === "on" ? true : false;
    friendlist.forEach((friend) =>{data.sender === friend.nickname ? friend.status = data.status : null});
    setFriendList([...friendlist]);
  };

  socketController.setSocketTypes([
    { type: "connect", func: onConnect },
    { type: "update", func: onUpdate },
  ]);

  useEffect(async () => {
    socketController.initSocket();
			const friendRequests = await api.getRequestFriendList();
			// const friends = await api.getFriendList();

			setFriendRequests(friendRequests);
			// setFriendList(friends);
    }, []);
    console.log("friendlist,", friendlist);

  return (
    <div id="box" style="margin: 15px;">
      <span id="manage">친구 관리</span>
      <RequestFriend />
      <hr className="line" />
      <div class="content">
        <span id="request">받은 친구 요청</span>
        <ul>
          {friendRequests &&
          friendRequests.receives &&
          friendRequests.receives.length > 0 ? (
            friendRequests.receives.map((req) => (
              <div>
                <li class="exchange">
                  {req.from_user}
                  <button
                    class="inter"
                    onClick={() =>
                      api.handleFriendRequest(req.from_user, "POST")
                    }
                  >
                    수락
                  </button>
                  <button
                    class="inter"
                    onClick={() =>
                      api.handleFriendRequest(req.from_user, "DELETE")
                    }
                  >
                    거절
                  </button>
                </li>
              </div>
            ))
          ) : (
            <span>받은 요청이 없습니다.</span>
          )}
        </ul>
      </div>
      <hr className="line" />
      <div class="content">
        <span id="request">보낸 친구 요청</span>
        <ul>
          {friendRequests && friendRequests.sends && friendRequests.sends.length > 0 ? (
            friendRequests.sends.map((req) => (
              <div>
                <li class="exchange">
                  {req.to_user}
                  <button
                    class="inter"
                    onClick={() =>
                      api.handleFriendRequest(req.to_user, "DELETE")
                    }
                  >
                    취소
                  </button>
                </li>
              </div>
            ))
          ) : (
            <span>보낸 요청이 없습니다.</span>
          )}
        </ul>
      </div>
      <hr className="line" />
      <div class="content">
        <span id="request">내 친구들</span>
        <ul>
          {friendlist &&
          friendlist.length &&
          friendlist.length > 0 ? (
            friendlist.map((item) => (
              <div>
                <li class="exchange" key={item.id}>
                  <NicknameModal nickname={item.nickname} />
                  <p>{item.status ? "접속중" : "비접속"}</p>
                  {/* <button class="inter" onClick={() => {seeInfo(item.nickname)}}>정보</button>
                        <button class="inter" onClick={() => api.deleteFriend(item.nickname)}>삭제</button> */}
                </li>
              </div>
            ))
          ) : (
            <span>친구가 없습니다.</span>
          )}
        </ul>
      </div>
    </div>
  );
};

export default FriendList;
