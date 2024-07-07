/* @jsx myReact.createElement */
import myReact , { Link, useState, useEffect } from "../core/myReact.js";
import Chat from "./Chat.js"
import api from "../core/Api_.js";
import UserStatus from "./UserStatus.js";
import FriendList from "./FriendList.js";

const Navbar = () => {
	const [data, setData] = useState({
		id: "",
		username: "",
		nickname: "",
		introduction: "",
		losses: "",
		total_games: "",
		wins: "",
		win_rate: "",
		image: "",
		email: "",
	});
	
	const [list, setList] = useState({
		sends: [],
		receives: [],
	});
	
	const [friendlist, setFriendList] = useState([]);
	
	useEffect(() => {
			const fetchData = async () => {
			const response = await api.getUserInfomation(localStorage.nickname);
			const friendRequests = await api.getRequestFriendList();
			const friends = await api.getFriendList();

			setList(friendRequests);
			setFriendList(friends);
			setData(response);
		};
		fetchData();
	}, []);

	return (<nav>
		<Chat socket={null}></Chat>
		<div id="btn-box">
			<div id="nav-btn-container">
				<Link to="login"><button id="btn-nav-login">로그인</button></Link>
				<Link to="api-login"><button id="btn-nav-42login">42로그인</button></Link>
			</div>
		</div>
		<FriendList list={list} friendlist={friendlist} />
		<div style="display=flex;">
			<UserStatus data={data} />
			{/* <div class="btn-class"> */}
				<button id="btn-nav-logout" onclick={() => {api.logout()}}>로그아웃</button>
			{/* </div> */}
			{/* <div class="btn-class"> */}
				<Link to="myinfo"><button class="btn-nav">정보</button></Link>
			{/* </div> */}
			{/* <div class="btn-class"> */}
				<Link to="setting"><button class="btn-nav">설정</button></Link>
			{/* </div> */}
		</div>
	</nav>)
}

export default Navbar;