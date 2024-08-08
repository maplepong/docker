/* @jsx myReact.createElement */
import myReact, { Link } from "../../core/myReact.js";
const TopNavbar = () => {
  return (
    <div id="top-nav-container">
      <Link to="home">
        <div id="main-logo">
          <h1 id="main-title">MAPLE•PONG</h1>
        </div>
      </Link>
    </div>
  );
};

export default TopNavbar;
