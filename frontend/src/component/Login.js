/* @jsx myReact.createElement */
import myReact , { Link } from "../core/myReact.js";
import { requestLogin, requestLogout } from "../core/Api.js";
import api from "../core/Api_.js";
import SignUp from "./SignUp.js";
import router from "../core/Router.js";
import "../css/login.css";

const Login = () => {
	async function login () {
		const username = document.querySelector("#input-username").value;
		const password = document.querySelector("#input-password").value;
		const otpBlock = document.querySelector("#otp-block")
		const getInfo = () => {
			return ([username, password]);
		}
		console.log("끼얏 호우!!!!");
		const response = await api.login(getInfo)
		if (response.status != 200) {
			console.log(response)
			if (response.status == 201) {
				otpBlock.style.display = "block"
			}
			return response;
		}
		else {
			console.log(response);
			myReact.redirect("home")
		}
	}

	async function checkOtp() {
		const username = document.querySelector("#input-username").value;
		const password = document.querySelector("#input-password").value;
		const pin = document.querySelector("#input-otp").value
		const response = await api.otpVerifyPin(username, pin)
		if (response.status != 200) {
			alert('otp를 다시 확인해주세요')
		}
		else {
			alert('otp 확인 완료')
			const relogin = await api.login(getInfo)
			if (relogin.status == 200) {
				console.log(response);
				myReact.redirect("home")
			}
			else {
				alert('무언가 오류가 발생했습니다. 다시 시도해주세요.')
			}
		}
	}

	return (
		<div id="login-box">
			<div id="infos">
				<div>					
					<div class="info">
						<input id="input-username" placeholder="ID"></input>
					</div>
					<div class="info">
						<input id="input-password" placeholder="password"></input>
					</div>
					<div id="otp-block" style="display:none;">
						<p style="color:white;">당신의 Email에서 QR 코드를 확인하고</p>
						<p style="color:white;">Google Authenticator를 통해</p>
						<p style="color:white;">입력받은 번호 6자리를 보내주세요.</p>
						<input id="input-otp"></input>
						<button style="margin:5px;" onclick={checkOtp}>확인</button>
					</div>
				</div>
				<div id="login">
					<button onclick={login}>로그인</button>
				</div>
			</div>
			<div id="other-btns">
				<div>
					<Link to="home">
						<button class="btns">Home</button>
					</Link>
				</div>
				<div>
					<Link to="api-test">
						<button class="btns">APITest</button>
					</Link>
				</div>
				<div>
					<Link to="signup">
						<button class="btns">회원가입</button>
					</Link>
				</div>
				<div>
					<Link to="api-login">
						<button class="btns">42 API 로그인</button>
					</Link>
				</div>
			</div>
		</div>
	)
}

export default Login;