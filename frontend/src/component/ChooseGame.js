/* @jsx myReact.createElement */
import myReact, { Link } from "../core/myReact.js";
import api from "../core/Api.js";
import "../css/home.css";

const ChooseGame = () => {
  return (
    <div id="choose-container">
      <div id="game-container">
        <Link to="localgame">
          <span class="word">미니게임</span>
          <div id="mini"></div>
        </Link>
        <Link to="tournament-waiting">
          <span class="word">토너먼트 참여</span>
          <div id="tour"></div>
        </Link>
        <Link to="lobby">
          <span class="word">게임하기</span>
          <div id="pong"></div>
        </Link>
      </div>
    </div>
  );
};

export default ChooseGame;
