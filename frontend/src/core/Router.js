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
import Navbar from "../component/Navbar/Navbar.js";
import Test from "../component/Test";
import ApiTest from "../component/ApiTest";
import Lobby from "../component/Lobby.js";
import GameRoom from "../component/Game/GameRoom.js";
import PingPong from "../component/Game/PlayingGameSingle.js";
import Tournament from "../component/Tournament/Tournament.js";
import TournamentWaiting from "../component/Tournament/TournamentWaiting.js";
import TournamentSchedule from "../component/Tournament/TournamentSchedule.js";
import TournamentGameRoom from "../component/Game/TournamentGameRoom.js";

const pathList = {
  "/": <App />,
  userinfo: <UserInfoPage />,
  login: <Login />,
  home: <Home />,
  myinfo: <MyInfo />,
  "api-login": <ApiLogin />,
  "api-test": <ApiTest />,
  signup: <SignUp />,
  "api-signup": <ApiSignUp />,
  gameroom: <GameRoom />,
  welcome: <Welcome />,
  lobby: <Lobby />,
  test: <Test />,
  localgame: <PingPong />,
  // tournament: <Tournament />,
  tournament: {
    lobby: <TournamentWaiting />,
    schedule: <TournamentSchedule />,
    gameroom: <TournamentGameRoom />,
  }
};

export default function router() {
  var path;
  let component;
  path = window.location.pathname.split("/")[1] || window.location.pathname;
  // console.log(window.location.pathname.split("/")[1]);
  const gameIdMatch = window.location.pathname.match(/^\/gameroom\/(\d+)$/);
  if (gameIdMatch) {
    const gameId = gameIdMatch[1];
    component = <GameRoom />;
  } else if (path==="tournament") {
    const subPath = window.location.pathname.split("/")[2];
    component = pathList[path][subPath];
  } else {
    component = pathList[path];
  }

  // console.log("component", component);
  if (component === undefined) {
    myReact.render(<Undefined />, "newPage");
  } else if (
    path === "login" ||
    path === "/" ||
    path === "signup" ||
    path === "api-login" ||
    path === "api-signup"
  ) {
    myReact.render(<div>{component}</div>, "newPage");
  } else {
    // myReact.render(component, "newPage"); //test develope
    myReact.render(
      <div>
        {component}
        <Navbar />
      </div>,
      "newPage"
    );
  }
}
