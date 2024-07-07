/* @jsx myReact.createElement */
import api from "../core/Api_.js";
import myReact , { useEffect, useState } from "../core/myReact.js";
import "../css/match.css"

const Matchhistory = (props) => {
	console.log("매치 히스토리: ", props);

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
						<div class="myInfo">미니게임 최장 생존: 1분 30초</div>
						<div class="myInfo">최다 라이벌: won</div>
						<div class="myInfo">승률: 25%</div>
					</div>
				</div>
				<div id="historybox">
					<div class="myInfo">gyopark님과의 패배에서 2:3 패배</div>
					<div class="myInfo">gyopark님과의 패배에서 2:3 패배</div>
					<div class="myInfo">gyopark님과의 패배에서 2:3 패배</div>
					<div class="myInfo">gyopark님과의 패배에서 2:3 패배</div>
					<div class="myInfo">gyopark님과의 패배에서 2:3 패배</div>
				</div>
			</div>
		</div>
	)

}

export default Matchhistory;