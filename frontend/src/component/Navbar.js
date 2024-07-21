/* @jsx myReact.createElement */
import myReact, { Link, useState, useEffect } from "../core/myReact.js";
import Chat from "./Chat.js";
import api from "../core/Api_.js";
import UserStatus from "./UserStatus.js";
import FriendList from "./FriendList.js";
import socketController from "../core/socket";

const Navbar = () => {
  const [data, setData] = useState({
    id: "",
    username: "",
    nickname: "",
    introduction: "",
    losses: "",
    total_games: "",
    wins: "",
    win_rate: "",
    image: "",
    email: "",
  });
  const [friendRequests, setFriendRequests] = useState({
    sends: [],
    receives: [],
  });

  const [friendList, setFriendList] = useState([]);

  const onConnect = (data) => {
    console.log("ws connnected data :", data.friends);
    data.friends.forEach((friend) => {
      friendList[friend.nickname] = friend.status === "on" ? true : false;
    });

    setFriendList(data.friends);
  };
  const onUpdate = (data) => {
    console.log("ws update data :", data);
    data.status = data.status === "on" ? true : false;
    friendList[data.sender] = data.status;
    // friendList.forEach((friend) =>{data.sender === friend.nickname ? friend.status = data.status : null});
    setFriendList(friendList);
  };

  socketController.setSocketTypes([
    { type: "connect", func: onConnect },
    { type: "update", func: onUpdate },
  ]);

  console.log("friendList,", friendList);

  useEffect(async () => {
    if (data.id === "") {
      const response = await api.getUserInfomation(localStorage.nickname);
      socketController.initSocket();
      const friendRequests = await api.getRequestFriendList(); // [{nickname: .. , id :..}]
      const friends = await api.getFriendList();
      const temp = {};
      friends.forEach((req) => {
        temp[req.nickname] = false;
      });

      setFriendRequests(friendRequests);
      setFriendList(temp);
      setData(response);
    }
    return () => {
      socketController._ws.current.close();
    };
  }, []);

  return (
    <nav>
      <Chat socket={null}></Chat>
      <div style="display: flex; flex-direction: row; width: 100%; height: auto;">
        <FriendList friendList={friendList} friendRequests={friendRequests} />
        <div style="flex-direction: column; margin: 5px;">
          <UserStatus data={data} />
          <div style="display: flex;">
            <button
              id="btn-nav-logout"
              style="margin: 5px;"
              onclick={() => {
                api.logout();
              }}
            >
              로그아웃
            </button>
            <Link to="myinfo">
              <button style="margin: 5px;">정보</button>
            </Link>
            <Link to="setting">
              <button style="margin: 5px;">설정</button>
            </Link>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
