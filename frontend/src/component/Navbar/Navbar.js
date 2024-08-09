/* @jsx myReact.createElement */
import myReact, {
  useEffect,
  useRef,
} from "../../core/myReact.js";
import Chat from "./Chat.js";
import api from "../../core/Api.js";
import UserStatus from "./UserStatus.js";
import FriendList from "./FriendList.js";
import socketController from "../../core/socket.js";

const Navbar = () => {
  const [data, setData] = myReact.useGlobalState("myinfo", {
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
  const [friendRequests, setFriendRequests] = myReact.useGlobalState(
    "friendRequest",
    {
      sends: [],
      receives: [],
    }
  );
  const friendsCount = useRef(0);

  const [friendList, setFriendList] = myReact.useGlobalState("friendList", {});

  const onConnect = (data) => {
    console.log("ws connnected data :", data.friends);
    if (!data.friends || data.friends.length === 0) {
      return;
    }
    data.friends.forEach((friend) => {
      friendList[friend.nickname] = {
        nickname: friend.nickname,
        status: friend.status === "on" ? true : false,
        image: "asset/user/default-user.png"
      };
    });

    friendsCount.current = data.friends.length;
    setFriendList(data.friends);
  };
  const onUpdate = (data) => {
    console.log("ws update data :", data);
    data.status = data.status === "on" ? true : false;
    friendList[data.sender] = { nickname: data.sender, status: data.status };
    friendsCount.current = Object.keys(friendList).length;
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
      if (friends.length != 0) {
        const temp = {};
        friends.forEach((req) => {
          temp[req.nickname] = {
            nickname: req.nickname,
            status: friendList[req.nickname]
            ? friendList[req.nickname].status
            : false,
          };
        });
        friendsCount.current = friends.length;
        setFriendList(temp);
        console.log("friendList", temp)
      }
      console.log("friendrEquest", friendRequests)
      setFriendRequests({sends: friendRequests.sends || [], recieves: friendRequests.receives});
      setData(response);
    }
  }, []);

  const refreshFriend = () => {
    socketController.sendMessage({ type: "connect" });
    console.log("connect sended");
  };

  return (
    <nav>
      <Chat socket={null}></Chat>
      <FriendList
        friendList={friendList}
        friendRequests={friendRequests}
        refresh={refreshFriend}
      />
        <UserStatus data={data} />
    </nav>
  );
};

export default Navbar;
