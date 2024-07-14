/* @jsx myReact.createElement */
import myReact, { useEffect, useState } from "../core/myReact.js";
import api from "../core/Api_.js";
import router from "../core/Router.js";
import GameList from "./GameList.js";
import "../css/tournament.css"

const Tournament = (props) => {
    return (<div>
        <div>
            <p>Tournament 이름</p>
            <div id="box" style="display:flex; flex-direction: row; justify-content:center;">
                <div style="display: block;">
                    <div style="display:flex; justify-content: space-between;">
                            <span class="users">
                                <img src="../css/img/logo.png"></img>
                                <p>1번 유저</p>
                            </span>
                            <span class="users">
                                <img src="../css/img/logo.png"></img>
                                <p>2번 유저</p>
                            </span>
                            <span class="users">
                                <img src="../css/img/logo.png"></img>
                                <p>3번 유저</p>                     
                            </span>
                            <span class="users">
                                <img src="../css/img/logo.png"></img>
                                <p>4번 유저</p>                    
                            </span>
                    </div>
                    <div style="display:flex; justify-content: space-between">
                            <span class="users">
                                <img src="../css/img/logo.png"></img>
                                <p>5번 유저</p>
                            </span>
                            <span class="users">
                                <img src="../css/img/logo.png"></img>
                                <p>6번 유저</p>
                            </span>
                            <span class="users">
                                <img src="../css/img/logo.png"></img>
                                <p>7번 유저</p>                    
                            </span>
                            <span class="users">
                                <img src="../css/img/logo.png"></img>
                                <p>8번 유저</p>                    
                            </span>
                    </div>
                </div>
                <div>
                    <div>주최자: </div>
                    <div>대기 시간: </div>
                    <div>최대 인원: 8명</div>
                    <div>시작 시간: </div>
                    <div>
                        <button>시작하기</button>
                        <button>start</button>
                    </div>
                </div>
            </div>
        </div>
    </div>)
}

export default Tournament