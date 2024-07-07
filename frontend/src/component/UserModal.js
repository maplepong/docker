/* @jsx myReact.createElement */
import { useEffect } from "react";
import myReact  from "../core/myReact.js";

const UserModal = (props) => {
	if (!props.id) return <p>UserModal Id not provided</p>;


	return <div class="modal-container">
		<ul>
		<li>유저</li>

		</ul>
	</div>	

}