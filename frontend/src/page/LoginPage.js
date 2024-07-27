/* @jsx myReact.createElement */
import myReact, { Link } from "../core/myReact.js";
import api from "../core/Api.js";
import "../css/login.css";

const Login = () => {
  async function login() {
    const username = document.querySelector("#input-username").value;
    const password = document.querySelector("#input-password").value;
    const otpBlock = document.querySelector("#otp-block");
    const getInfo = () => {
      return [username, password];
    };
    console.log("끼얏 호우!!!!");
    const response = await api.login(getInfo);
    if (response.status != 200) {
      console.log(response);
      if (response.status == 201) {
        otpBlock.style.display = "block";
      }
      return response;
    } else {
      console.log(response);
      myReact.redirect("home");
    }
  }

  async function checkOtp() {
    const username = document.querySelector("#input-username").value;
    const password = document.querySelector("#input-password").value;
    const pin = document.querySelector("#input-otp").value;
    const response = await api.otpVerifyPin(username, pin);
    const getInfo = () => {
      return [username, password];
    };
    if (response.status != 200) {
      alert("otp를 다시 확인해주세요");
    } else {
      alert("otp 확인 완료.");
      await api.logout();
      alert("새로 로그인 합니다.");
      await api.login(getInfo);
      console.log(response);
      myReact.redirect("home");
    }
  }

  return (
    </
  );
};

export default Login;
