/* @jsx myReact.createElement */
// import Login from "./component/Login.js";
// import MyInfo from "./component/MyInfo.js";
import axios from "axios";
import myReact, { Link } from "./core/myReact.js";
import myReactDOM from "./core/myReactDOM.js";
import {
  requestLogin,
  requestFriendList,
  requestUserInfo,
} from "./core/Api.js";
import FriendList from "./component/Navbar/FriendList.js";
import RequestFriend from "./component/RequestFriend.js";
import { useState, useEffect } from "./core/myReact.js";
import Login from "./component/Login.js";
import SignUp from "./component/SignUp.js";
import "./css/index.css";
import "./css/friend.css";
import Test from "./component/Test.js";
import api from "./core/Api_.js";
import Navbar from "./component/Navbar/Navbar.js";

const setAxios = () => {
  axios.defaults.baseURL = "https://localhost/api/";
  // axios.defaults.baseURL = "http://localhost:8001/";
  axios.defaults.timeout = 3000;
};

const App = ({children}) => {
  const [loginState, setLoginState] = useState(false);
  function checkLogin() {
    if (localStorage.accessToken) {
      setLoginState(true);
    }
  }

  document.addEventListener("DOMContentLoaded", () => checkLogin());

  if (loginState) {
    return (
      <div class="app">
        {children}
        <Navbar />
      </div>
    );
  }
  else {
    return (
    <div class="app">
      <Link to="">
        <img id="bg"></img>
      </Link>
      <Login />
    </div>
  );}
};

export default App;
