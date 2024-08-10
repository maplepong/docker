/* @jsx myReact.createElement */
import api from "../core/Api.js";
import myReact , { useEffect, useState } from "../core/myReact.js";
import "../css/match.css"

const Matchhistory = (props) => {
	console.log("매치 히스토리: ", props.data);
	
	const [gameRecords, setGameRecords] = useState([]);
	useEffect(() => {
		const fetchData = async () => {
			const response = await api.getGameRecord();
			console.log("GAMERECORD", response)
			console.log("game_records", response.data.game_records)
			if (response && response.data && response.data.game_records) {
				setGameRecords(response.data.game_records);
				console.log("Updated gameRecords", response.data.game_records[0].opponent);
			} else {
				console.error("No data returned from API");
			}
		};
		fetchData();
	}, []);

	console.log("gameRecords len", gameRecords.length);

	return (
		<div id="matchbox">
			<div style="margin: 10px"> 대전 기록 </div>
			<div style="display:flex;">
				<div id="infobox">
					<div style="margin: 5px">
						<div style="display: flex; flex-direction: column; margin: 5px">
							<div>{localStorage.nickname}</div>
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
				<div style="display: flex; flex-wrap: wrap;">
					<strong>Opponent</strong><br />
					<strong>Your Score</strong><br />
					<strong>Opponent's Score</strong><br />
					<strong>Result</strong><br />
					<strong>Game Date</strong><br />
					{gameRecords.length > 0 ? (
						gameRecords.map((record, index) => (
							<div key={index} style={{ marginRight: "20px" }}>
								<span style={{ fontSize: "6px" }}>
									{record.opponent || "no opponet data"}
								</span>
								<span style={{ fontSize: "6px" }}>
									{record.user_score}
								</span>
								<span style={{ fontSize: "6px" }}>
									{record.opponent_score}
								</span>
								<span style={{ fontSize: "6px" }}>
									{record.result}
								</span>
								<span style={{ fontSize: "6px" }}>
									{record.game_date}
								</span>
							</div>
						))
					) : (
						<p>No game records available</p>
					)}
				</div>
			</div>
		</div>
	)

}

export default Matchhistory;