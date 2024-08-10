/* @jsx myReact.createElement */
import myReact, { Link } from "../../core/myReact.js";
import { useState, useEffect } from "../../core/myReact.js";
import "../../css/FriendList.css";
import api from "../../core/Api.js";
import NicknameModal from "../NicknameModal.js";
import RequestFriend from "../RequestFriend.js";
import Friend from "./Friend.js";

const FriendList = (props) => {
  const friendList = Object.values(props.friendList);
  const friendRequests = props.friendRequests;

  console.log("friendList", friendList);
  console.log("friendRequests", friendRequests);

  return (
    <div id="friend-list-container" class="box">
      <div id="friend-list-title">
        <h2>친구 목록</h2>
        <RequestFriend />
        <button onclick={() => props.refresh()}>새로고침</button>
      </div>
      <ul id="friend-list-ul">
        {friendRequests &&
        friendRequests.receives &&
        friendRequests.receives.length > 0
          ? friendRequests.receives.map((req) => (
              <Friend
                nickname={req.from_user}
                type="request_receive"
                status="request"
                image={""}
              />
            ))
          : null}
        {friendRequests &&
        friendRequests.sends &&
        friendRequests.sends.length > 0
          ? friendRequests.sends.map((req) => (
              <Friend
                nickname={req.to_user}
                type="request_send"
                status="sending"
                image={""}
              />
            ))
          : null}
        {friendList && friendList.length > 0
          ? friendList.map((friend) => (
              <Friend
                nickname={friend.nickname}
                type="friend"
                status={friend.status}
                image={friend.image}
              />
            ))
          : null}
      </ul>
    </div>
  );
};

export default FriendList;
