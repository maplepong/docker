/* @jsx myReact.createElement */
import myReact, { useState, useEffect } from "../core/myReact.js";
// import { useState } from "../core/myReact.js";
import api from "../core/Api_.js";
import FriendList from "./FriendList.js";
import ChooseGame from "./ChooseGame.js";
import UserStatus from "./UserStatus.js";
import "../css/home.css";
import Chat from "./Chat.js";

const Home = () => {
  // const [data, setData] = useState({
  //   id: "",
  //   username: "",
  //   nickname: "",
  //   introduction: "",
  //   losses: "",
  //   total_games: "",
  //   wins: "",
  //   win_rate: "",
  //   image: "",
  //   email: "",
  // });

  // const [list, setList] = useState({
  //   sends: [],
  //   receives: [],
  // });

  // const [friendlist, setFriendList] = useState([]);

  // useEffect(() => {
  //   const fetchData = async () => {
  //     const response = await api.getUserInfomation(localStorage.nickname);
  //     const friendRequests = await api.getRequestFriendList();
  //     const friends = await api.getFriendList();

  //     setList(friendRequests);
  //     setFriendList(friends);
  //     setData(response);
  //   };
  //   fetchData();
  // }, []);

  return (
    <div id="home">
      <ChooseGame />
      {/* <div id="myStatus"> */}
      {/* <UserStatus data={data} /> */}
      {/* <FriendList list={list} friendlist={friendlist} /> */}
      {/* <Chat /> */}
      {/* </div> */}
    </div>
  );
};

export default Home;
