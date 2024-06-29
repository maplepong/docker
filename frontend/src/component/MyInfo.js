/* @jsx myReact.createElement */
import myReact from "../core/myReact.js"
import UserInfo from "./UserInfo.js"
import "../css/MyInfo.css"

const MyInfo = () => {
	return (
		<div>
			<UserInfo nickname={localStorage.nickname} />
		</div>
	)
}

export default MyInfo;