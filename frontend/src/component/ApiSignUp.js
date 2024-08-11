/* @jsx myReact.createElement */
import myReact from "../core/myReact.js";
import api from "../core/Api.js";

const ApiSignUp = () => {
  async function getInfo() {
    const username = localStorage.getItem("username");
    const nickname = document.querySelector("#new-nickname").value;
    const response = api.requestApiSignup(username, nickname);
    localStorage.removeItem("username");
    if (response.status === 201) myReact.redirect("/");
  }

  return (
    <div id="Signup-container">
      <input id="new-nickname" placeholder="nickname"></input>
      <button id="btn-request-ApiSignup" onClick={getInfo}>
        42 API SignUp
      </button>
      <p id="p-login-error"></p>
    </div>
  );
};

export default ApiSignUp;
