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
		const getInfo = () => {
			return ([username, password]);
		}
		console.log("끼얏 호우!!!!");
		const response = await api.login(getInfo)
		if (response.status != 200) {
			console.log(response)
			return response;
		}
		else {
			console.log(response);
			myReact.redirect("home")
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