/* @jsx myReact.createElement */
import myReact, { useState, useEffect } from "../core/myReact.js";
// import { useState } from "../core/myReact.js";
import api from "../core/Api_.js";
import FriendList from "./Navbar/FriendList.js";
import ChooseGame from "./ChooseGame.js";
import UserStatus from "./Navbar/UserStatus.js";
import "../css/home.css";
import Chat from "./Navbar/Chat.js";

const Home = () => {
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
