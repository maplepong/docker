/* @jsx myReact.createElement */
import api from "../core/Api_.js";
import myReact , { useEffect, useState } from "../core/myReact.js";
import "../css/MyInfo.css"
import "./Matchhistory.js"
import Matchhistory from "./Matchhistory.js";

const UserInfo = (props) => {

    if (window.location.pathname != "/myinfo"){
        props.nickname = window.location.pathname.split('/')[2];
    }

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

    useEffect(() => {
        const fetchData = async () => {
			const response = await api.getUserInfomation(props.nickname);
			console.log("USERINFO", response)
			if (response) {
				setData(response);
			} else {
				console.error("No data returned from API");
			}
        };
        fetchData();
    }, []);

	// function patchInfo() {
	// 	var patchBox = document.querySelector(".infoPatchBox");
	// 	patchBox.style.display = "block";
	// }

	async function changeInfo(flag) {
		if (flag === 1) {
			var introError = document.querySelector("#intro-error")
			var newIntro = document.querySelector("#newIntro").value
			console.log(newIntro)
			if (newIntro === null || newIntro === undefined || !newIntro || newIntro === data.introduction) {
				introError.style.display = "block"
				return ;
			}
			var response = await api.patchUserInfomation(flag, newIntro);
		} else {
			var nickError = document.querySelector("#nick-error")
			var newNick = document.querySelector("#newNickname").value
			if (newNick === null || newNick === undefined || !newNick || newNick === data.nickname) {
				nickError.style.display = "block"
				return ;
			}
			var response = await api.patchUserInfomation(flag, newNick);
		} 
		setData(response)
	}

	const onFileChange = (e) => {
		if (!e)
			console.log("이미지에 문제가잇수")
		else
			console.log(e)
		const {
			target: {files},
		} = e;
		const filefile = files[0]; //우선 1개만 보여줄꺼니까 크기 1로 지정
		patchImage(filefile);
	}

	async function patchImage(FILE){
		const del = await api.userImage("DELETE")
		console.log("del", del);
		console.log(FILE)
		const post = await api.userImage("POST", FILE)
		console.log("post", post);
		setData({...data, image : post.data.image});
	}

	return (
		<div style="display:flex;">
			<div id="container-myinfo">
				<div id="myinfo-headline">
					<p>내정보</p>
					<button>X</button>
				</div>

				<div class="modal fade" id="exampleModal1" tabindex="-1" aria-labelledby="exampleModalLabel" aria-hidden="true">
				<div class="modal-dialog">
					<div class="modal-content">
					<div class="modal-header">
						<h5 class="modal-title" id="exampleModalLabel">새로운 자기소개를 입력해주세요.</h5>
						<button type="button" class="close" data-dismiss="modal" aria-label="Close">
						<span aria-hidden="true">&times;</span>
						</button>
					</div>
					<div class="modal-body">
						적절한 자기소개를 입력해 주세요.
						이전 자기소개와 동일하거나, 빈 자기소개는 안돼요.
					</div>
					<input id="newIntro"></input>
					<div class="modal-footer">
						<button type="button" class="btn btn-secondary" data-dismiss="modal">Close</button>
						<button type="button" class="btn btn-primary" onclick={() => changeInfo(1)}> Save changes</button>
					</div>
					</div>
				</div>
				</div>

				<div class="modal fade" id="exampleModal2" tabindex="-1" aria-labelledby="exampleModalLabel" aria-hidden="true">
				<div class="modal-dialog">
					<div class="modal-content">
					<div class="modal-header">
						<h5 class="modal-title" id="exampleModalLabel">새로운 닉네임을 알려주세요.</h5>
						<button type="button" class="close" data-dismiss="modal" aria-label="Close">
						<span aria-hidden="true">&times;</span>
						</button>
					</div>
					<div class="modal-body">
						적절한 닉네임을 입력해 주세요.
						이전 닉네임과 동일하거나, 빈 닉네임은 안돼요.
					</div>
					<input id="newNickname"></input>
					<div class="modal-footer">
						<button type="button" class="btn btn-secondary" data-dismiss="modal">Close</button>
						<button type="button" class="btn btn-primary" onclick={() => changeInfo(2)}> Save changes</button>
					</div>
					</div>
				</div>
				</div>

				<div class="modal fade" id="exampleModal3" tabindex="-1" aria-labelledby="exampleModalLabel" aria-hidden="true">
				<div class="modal-dialog">
					<div class="modal-content">
					<div class="modal-header">
						<h5 class="modal-title" id="exampleModalLabel">새로운 이미지를 업로드 해주세요.</h5>
						<button type="button" class="close" data-dismiss="modal" aria-label="Close">
						<span aria-hidden="true">&times;</span>
						</button>
					</div>
					<div class="modal-body">
						파일을 업로드하면 이미지가 변경됩니다.
					</div>
						<input type="file" accept="image/*" id="testUpload" onchange={onFileChange}></input>
					<div class="modal-footer">
						<button type="button" class="btn btn-secondary" data-dismiss="modal">Close</button>
						{/* <button type="button" class="btn btn-primary" onclick={onFileChange}> Save changes</button> */}
					</div>
					</div>
				</div>
				</div>

				<div id="myinfo-body" onclick={() => console.log(data)}>
					<img id="myinfo-img" src={data.image}></img>
					{/* <button onclick={() => patchInfo()}>이미지 변경</button> */}
					<button type="button" class="btn btn-primary" data-toggle="modal" data-target="#exampleModal3">
							이미지 변경
					</button>
					<ul id="info-body">
						<li>
							<span> id </span>
							<span> {data.id} </span>
						</li>
						<li>
							<span> introduction </span>
							<span> {data.introduction} </span>
							<button type="button" class="btn btn-primary" data-toggle="modal" data-target="#exampleModal1">
  								변경
							</button>
						</li>
						<li>
							<span> lose </span>
							<span> {data.losses} </span>
						</li>
						<li>
							<span> nickname </span>
							<span> {data.nickname} </span>
							<button type="button" class="btn btn-primary" data-toggle="modal" data-target="#exampleModal2">
								변경
							</button>
						</li>
						<li>
							<span> totalgame </span>
							<span> {data.total_games} </span>
						</li>
						<li>
							<span> username </span>
							<span> {data.username} </span>
						</li>
						<li>
							<span> wins </span>
							<span> {data.wins} </span>
						</li>
						<li>
							<span> win_rate </span>
							<span> {data.win_rate} </span>
						</li>
						<li>
							<span> email </span>
							<span> {data.email} </span>
						</li>
						{/* <li>image {data.image}</li> */}
					</ul>
				</div>
			</div>
			{/* <div id="patchBox">
				<div class="infoPatchBox">
					<p>이미지를 업로드 해주세요.</p>
					<p>파일을 선택하면 이미지가 변경됩니다.</p>
					<div>
						<input type="file" accept="image/*"  id="testUpload" onchange={onFileChange}></input>
					</div>
				</div>
			</div> */}
			<Matchhistory data={data}/>
		</div>
	)
}

export default UserInfo;