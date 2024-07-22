/* @jsx createElement */
import createElement from "./createElement.js";
import myReact from "../core/myReact.js";
import App from "../app.js";
import Undefined from "../component/Undefined.js";
import Home from "../component/Home.js";
import Welcome from "../component/Welcome.js";
import Login from "../component/Login.js";
import MyInfo from "../component/MyInfo.js";
import UserInfoPage from "../component/UserInfoPage.js";
import ApiLogin from "../component/ApiLogin.js";
import SignUp from "../component/SignUp.js";
import ApiSignUp from "../component/ApiSignUp.js";
import Game from "../component/Game/PlayingGame.js";
import Navbar from "../component/Navbar/Navbar.js";
import Test from "../component/Test";
import ApiTest from "../component/ApiTest";
import Lobby from "../component/Lobby.js";
import FriendList from "../component/Navbar/FriendList.js";
import UserInfo from "../component/UserInfo";
import GameRoom from "../component/Game/GameRoom.js";
import PingPong from "../component/Game/PlayingGame.js";
import Tournament from "../component/Tournament.js";

const pathList = {
  "/": <Login />,
  userinfo: <UserInfoPage />,
  login: <Login />,
  home: <Home />,
  myinfo: <MyInfo />,
  "api-login": <ApiLogin />,
  "api-test": <ApiTest />,
  signup: <SignUp />,
  "api-signup": <ApiSignUp />,
  gameroom: <Game />,
  welcome: <Welcome />,
  lobby: <Lobby />,
  test: <Test />,
  lobby: <Lobby />,
  pingpong: <PingPong />,
  tournament: <Tournament />,
};

export default function router() {
  var path;
  let component;
  path = window.location.pathname.split("/")[1] || window.location.pathname;
  // console.log(window.location.pathname.split("/")[1]);
  const gameIdMatch = window.location.pathname.match(/^\/gameroom\/(\d+)$/);
  if (gameIdMatch) {
    const gameId = gameIdMatch[1];
    component = <GameRoom gamdId={gameId}/>;
  } else {
    component = pathList[path];
  }

  // console.log("component", component);
  if (component === undefined) {
    myReact.render(<Undefined />, "newPage");
  } else {
    myReact.render(<App children={component} />, "newPage");
  }
}
