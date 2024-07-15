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
		{/* <div id="btn-box"> */}
			{/* <div id="nav-btn-container"> */}
				{/* <Link to="api-login"><button id="btn-nav-42login">42로그인</button></Link> */}
			{/* </div> */}
		{/* </div> */}
		<div style="display: flex; flex-direction: row; width: 100%; height: auto;">
			<FriendList list={list} friendlist={friendlist} />
			<div style="flex-direction: column; margin: 5px;">
				<UserStatus data={data} />
				<div style="display: flex;">
					{/* <Link to="login"> */}
						{/* <button id="btn-nav-login" style="margin: 5px;">로그인</button> */}
					{/* </Link> */}
					<button id="btn-nav-logout" style="margin: 5px;" onclick={() => {api.logout()}}>로그아웃</button>
					<Link to="myinfo">
						<button style="margin: 5px;">정보</button>
					</Link>
					<Link to="setting">
						<button style="margin: 5px;">설정</button>
					</Link>
				</div>
			</div>
		</div>
	</nav>)
}

export default Navbar;