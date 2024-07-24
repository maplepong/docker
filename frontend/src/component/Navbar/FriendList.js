/* @jsx myReact.createElement */
import myReact, { Link } from "../../core/myReact.js";
import { useState, useEffect } from "../../core/myReact.js";
import "../../css/friend.css";
import api from "../../core/Api.js";
import NicknameModal from "../NicknameModal.js";
import RequestFriend from "../RequestFriend.js";

const FriendList = (props) => {
  const friendList = props.friendList;
  const friendRequests = props.friendRequests;
  console.log("friendList..", friendList);
  Object.entries(friendList).map(([key, value]) => {
    console.log("key : " + key + "value : " + value);
  });

  return (
    <div id="box" style="margin: 15px;">
      <button onclick={() => props.refresh()}>새로고침</button>
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
          {friendRequests &&
          friendRequests.sends &&
          friendRequests.sends.length > 0 ? (
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
          {friendList && Object.keys(friendList).length > 0 ? (
            Object.entries(friendList).map(([key, value]) => (
              <div>
                <li class="exchange">
                  <NicknameModal nickname={key} />
                  <p>{value ? "접속중" : "비접속"}</p>
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
