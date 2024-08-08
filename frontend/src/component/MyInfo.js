/* @jsx myReact.createElement */
import myReact, { useState, useEffect } from "../core/myReact.js"
import UserInfo from "./UserInfo.js"
import "../css/MyInfo.css"
import api from "../core/Api.js";

const MyInfo = () => {
	// const [data, setData] = useState({
	// 	oppnent: "",
	// 	user_score: "",
	// 	opponent_score: "",
	// 	result: "",
	// 	game_date: "",
	// });

	// useEffect(() => {
	// 	const fetchData = async () => {
	// 		const response = await api.getGameRecord();
	// 		console.log("GAMERECORD", response)
	// 		if (response) {
	// 			setData(response);
	// 		} else {
	// 			console.error("No data returned from API");
	// 		}
	// 	};
	// 	fetchData();
	// }, []);
	return (
		<div>
			<UserInfo nickname={localStorage.nickname} />
			{/* <div>
				<h2>Game Record</h2>
				<p><strong>Opponent:</strong> {data.opponent}</p>
				<p><strong>Your Score:</strong> {data.user_score}</p>
				<p><strong>Opponent's Score:</strong> {data.opponent_score}</p>
				<p><strong>Result:</strong> {data.result}</p>
				<p><strong>Game Date:</strong> {data.game_date}</p>
			</div> */}
		</div>
	)
}

export default MyInfo;