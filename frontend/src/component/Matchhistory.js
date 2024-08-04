/* @jsx myReact.createElement */
import api from "../core/Api.js";
import myReact , { useEffect, useState } from "../core/myReact.js";
import "../css/match.css"

const Matchhistory = (props) => {
	console.log("매치 히스토리: ", props);
	
	const [data, setData] = useState({
		oppnent: "",
		user_score: "",
		opponent_score: "",
		result: "",
		game_date: "",
	});

	useEffect(() => {
		const fetchData = async () => {
			const response = await api.getGameRecord();
			console.log("GAMERECORD", response)
			if (response) {
				setData(response);
			} else {
				console.error("No data returned from API");
			}
		};
		fetchData();
	}, []);

	return (
		<div id="matchbox">
			<div style="margin: 10px"> 대전 기록 </div>
			<div style="display:flex;">
				<div id="infobox">
					<div style="margin: 5px">
						<img src={props.data.image} style="width: 10%; height: 10%"></img>
						<div style="display: flex; flex-direction: column; margin: 5px">
							<div>{props.data.nickname}</div>
							<div>LV 42</div>
						</div>
					</div>
					<div style="display: flex; flex-direction: column; margin: 5px">
						<div class="myInfo">최신 토너먼트 등수 : 1등</div>
						{/* <div class="myInfo">미니게임 최장 생존: 1분 30초</div> */}
						<div class="myInfo">최다 라이벌: won</div>
						<div class="myInfo">승률: 25%</div>
					</div>
				</div>
				<div>
					<h2>Game Record</h2>
					<p><strong>Opponent:</strong> {data.opponent}</p>
					<p><strong>Your Score:</strong> {data.user_score}</p>
					<p><strong>Opponent's Score:</strong> {data.opponent_score}</p>
					<p><strong>Result:</strong> {data.result}</p>
					<p><strong>Game Date:</strong> {data.game_date}</p>
				</div>
			</div>
		</div>
	)

}

export default Matchhistory;