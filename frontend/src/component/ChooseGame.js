/* @jsx myReact.createElement */
import myReact, { Link } from "../core/myReact.js";
import api from "../core/Api.js";
import "../css/home.css";

const ChooseGame = () => {
  return (
    <div id="choose-container">
      {/* <Link to="localgame">
        <div id="mini">
          <span class="word">미니게임</span>
        </div>
      </Link> */}
      <Link to="tournament-waiting" class="word">
        <span>토너먼트 참여</span>
        <div id="tour"></div>
      </Link>
      <Link to="lobby" class="word">
        <span>게임하기</span>
        <div id="pong"></div>
      </Link>
    </div>
  );
};

export default ChooseGame;
