/* @jsx myReact.createElement */
import api from "../core/Api_.js";
import myReact from "../core/myReact.js";
import '../css/UserStatus.css';

const UserStatus = (props) => {
	return ( 
		<div id="container-UserStatus">
			<div id="info-line">
				<div id="info" style="flex-direction: column;">
					<div class="usernickname">{localStorage.nickname}</div>
					<div class="level">level 42</div>
				</div>
				<img id="statImage" src={props.data.image} style="margin-left:5px; margin-right:5px;"></img>
			</div>
			<div class="status-line" style="background-color: #f1f1f1">
				<div id="stat-name">핑퐁 승률</div>
				<div id="stat-value">
					<div id="stat-value-text">25/50</div>
					<div id="stat-value-bar" class="red" data-value="25" />
				</div>
			</div>
			<div class="status-line" style="background-color: #DADADA; border-bottom-left-radius: 10px;">
				<div id="stat-name">토너먼트 성적</div>
				<div id="stat-value">
					<div id="stat-value-text">4/5</div>
					<div id="stat-value-bar" class="blue" data-value="4" />
				</div>
			</div>
		</div>
	)
}

export default UserStatus;