/* @jsx myReact.createElement */
import myReact from "../core/myReact.js";
import api from "../core/Api_.js"

const TestLogin = () => {
	async function requestLogin() {
		const res = await api.login(() => {return ["test", "4545"]})
	}
	return 		<button onclick={requestLogin}>login: test</button>
}


export default TestLogin;
