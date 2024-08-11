/* @jsx myReact.createElement */
import myReact from "../core/myReact.js"
import UserInfo from "./UserInfo.js"
import "../css/MyInfo.css"

const UserInfoPage = (props) => {
	return (
		<div>
			<UserInfo nickname={props} />
		</div>
	)
}

export default UserInfoPage;