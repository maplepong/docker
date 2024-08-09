/* @jsx myReact.createElement */
import myReact, { Link } from "../../core/myReact.js";
import api from "../../core/Api.js";
const TopNavbar = () => {
  return (
    <div id="top-nav-container">
      <Link to="home">
        <div id="main-logo">
          <h1 id="main-title">MAPLE•PONG</h1>
        </div>
      </Link>
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
      </div>
    </div>
  );
};

export default TopNavbar;
