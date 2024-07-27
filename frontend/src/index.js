/* @jsx myReact.createElement */
// import Login from "./component/Login.js";
// import MyInfo from "./component/MyInfo.js";
import myReact, { Link } from "./core/myReact.js";
import "./css/index.css";
import "./css/friend.css";

// const Index = () => {
//     return <div>
//         <Link to="login">
//         <button>입장하기</button>
//         </Link>
//     </div>
// }

const Index = () => {
    // setAxios(); // 필요 없다고 함
  
    function checkLogin() {
      if (localStorage.accessToken) {
        const login = document.querySelector("#btn-nav-login");
        // const logout = document.querySelector("#btn-nav-logout");
        if (login) login.style.display = "none";
      }
    }
  
    document.addEventListener("DOMContentLoaded", () => checkLogin());

        return (
        <div class="index">
          <img id="bg"></img>
          <Link to="login">
            <button>입장하기</button>
          </Link>
        </div>
    );
  };
  
  export default Index;
  

// export default Index;