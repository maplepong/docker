/* @jsx myReact.createElement */
import myReact, { useState, useEffect } from "../core/myReact.js"
import UserInfo from "./UserInfo.js"
import "../css/MyInfo.css"
import api from "../core/Api.js";

const MyInfo = () => {
	return (
		<div>
			<UserInfo nickname={localStorage.nickname} />
		</div>
	)
}

export default MyInfo;