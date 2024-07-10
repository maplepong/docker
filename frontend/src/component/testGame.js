/* @jsx myReact.createElement */
import myReact, { useState, useEffect } from "../core/myReact.js";
import GameRoom from "./GameRoom.js";
import "../css/Pingpong.css";

const NewPingPong = ({gameinfo}) => {

    const canvas = document.querySelector("myCanvas");

    const context = canvas.getContext("2d");

    const startBtn = document.querySelector(".start-btn");

    let gameRunning = false;

    let animationId;

    const [score, setScore] = useState({ left: 0, right: 0 });

    if (!gameinfo || !socket) {
        console.log("something is wrong...");
        return null;
    }

    // 사용자 패들 생성
    let user = {
        x: 0,
        y: canvas.height/2 - 100/2,
        width: 10,
        height: 100,
        color: "red",
        score: 0
    }

    // 적 패들 생성
    let enemy = {
        x: canvas.width - 10,
        y: canvas.height/2 - 100/2,
        width: 10,
        height: 100,
        color: "black",
        score: 0
    }

    // 공 생성
    let ball = {
        x: canvas.width / 2,
        y: canvas.height / 2,
        radius: 10,
        speed: 5,
        velocityX: 5,
        velocityY: 5,
        color: "white"
    }

    // 네트 생성
    const net = {
        x: canvas.width/2 - 1,
        y: 0,
        width: 2,
        height: 10,
        color: "white"
    }

    addEventListener("load", (event) => {
        render();
    });

    // 웹소켓 데이터 수신(상대 위치)
    socket.onmessage = function(event) {
        const message = JSON.parse(event.data);
        const type = message.type;
        console.log('Received:', message);

        if (type == "game_update")
        {
            // Update enemy object if the message contains enemy data
            if (message.user) {
                enemy.x = message.user.x;
                enemy.y = message.user.y;
                enemy.width = message.user.width;
                enemy.height = message.user.height;
                enemy.color = message.user.color;
                enemy.score = message.user.score;
            }
        }
    };

    function sendUserPosition() {
        if (socket && socket.readyState === WebSocket.OPEN) {
            socket.send(JSON.stringify({ user: user, type: "game_update", nickname : localStorage.getItem("nickname") }));
        } else {
            console.error("Socket is not ready for sending user position");
        }
    }

    // 웹소켓 데이터 송신(자신 위치)


    // 네트 그리기 함수
    function drawNet() {
        const netWidth = 4; // 필요에 따라 네트 폭 조절
        const netSpacing = 15; // 필요에 따라 간격 조절

        // 왼쪽 절반 네트 그리기
        for (let i = 0; i <= canvas.height; i += netSpacing) {
            drawRectangle(net.x, net.y + i, netWidth, net.height, net.color);
        }

        // 오른쪽 절반 네트 그리기
        for (let i = 0; i <= canvas.height; i += netSpacing) {
            drawRectangle(net.x + net.width - netWidth, net.y + i, netWidth, net.height, net.color);
        }
    }


    // 직사각형 그리기 함수
    function drawRectangle(x, y, w, h, color) {
        context.fillStyle = color;
        context.fillRect(x, y, w, h);
    }

    // 원 그리기 함수
    function drawCircle(x, y, r, color) {
        context.fillStyle = color;
        context.beginPath();
        context.arc(x, y, r, 0, Math.PI * 2, false);
        context.closePath();
        context.fill();
    }

    // 텍스트 그리기 함수
    function drawText(text, x, y, color) {
        context.fillStyle = color;
        context.font = "45px fantasy";
        context.fillText(text, x, y);
    }

    // 게임 렌더링 함수
    function render() {
        // 캔버스 초기화
        drawRectangle(0, 0, canvas.width, canvas.height, "green");

        // 네트 그리기
        drawNet();

        // 점수 표시
        drawText(user.score, canvas.width / 4, canvas.height / 5, "white");
        drawText(enemy.score, (3 * canvas.width) / 4, canvas.height / 5, "white");

        // 사용자 및 컴퓨터 패들 그리기
        drawRectangle(user.x, user.y, user.width, user.height, user.color);
        drawRectangle(enemy.x, enemy.y, enemy.width, enemy.height, enemy.color);

        // 공 그리기
        drawCircle(ball.x, ball.y, ball.radius, ball.color);

        // 중앙의 흰색 선 그리기
        drawRectangle(net.x, net.y, net.width, canvas.height, net.color);
    }

    // 사용자 입력 대기
    document.addEventListener("keydown", keyDownHandler, false);
    document.addEventListener("keyup", keyUpHandler, false);
    document.addEventListener("keydown", topkeyDownHandler, false);
    document.addEventListener("keyup", topkeyUpHandler, false);
    
    //마우스로 패들을 조종한다고 합니다
    // function movePaddle(evt) {
    //     let rectangle = canvas.getBoundingClientRect();
       
    //     user.y = evt.clientY - rectangle.top - user.height/2;
    // }

    //화살표 키 눌렀을때
    function keyDownHandler(e) {
        if (e.key === "Right" || e.key === "ArrowRight") {
            rightPressed = true;
            //user X 위치를 오른쪽으로 이동
        } else if (e.key === "Left" || e.key === "ArrowLeft") {
            leftPressed = true;
            //user X 위치를 왼쪽으로 이동
        }
    }

    //화살표 키 땠을 때
    function keyUpHandler(e) {
        if (e.key === "Right" || e.key === "ArrowRight") {
            rightPressed = false;
        } else if (e.key === "Left" || e.key === "ArrowLeft") {
            leftPressed = false;
        }
    }

    // 충돌 검출 함수
    function collision(b, p) {
        b.top = b.y - b.radius;
        b.bottom = b.y + b.radius;
        b.left = b.x - b.radius;
        b.right = b.x + b.radius;

        p.top = p.y;
        p.bottom = p.y + p.height;
        p.left = p.x;
        p.right = p.x + p.width;

        return b.right > p.left && b.bottom > p.top && b.left < p.right && b.top < p.bottom; 
    }

    // 공 초기화 함수
    function resetBall() {
        ball.x = canvas.width / 2;
        ball.y = canvas.height / 2;

        ball.speed = 5;
        ball.velocityX = -ball.velocityX;
    }

    // 업데이트 함수
    function update() {
        ball.x += ball.velocityX;
        ball.y += ball.velocityY;

        let player = (ball.x < canvas.width/2);

        if(collision(ball, player)) {
        // 공이 플레이어에 부딪힌 위치
            let collidePoint = ball.y - (player.y + player.height/2);

        // 정규화
            collidePoint = collidePoint / (player.height/2);

        // 라디안 각도 계산
            let angleRad = collidePoint * Math.PI/4;

        // 부딪힐 때 공의 X 방향
            let direction = (ball.x < canvas.width/2) ? 1 : -1;


        // X 및 Y 속도 변경
            ball.velocityX = direction * ball.speed * Math.cos(angleRad);

            ball.velocityY = ball.speed * Math.sin(angleRad);

        // 패들이 공을 받을 때 마다 속도 증가
            ball.speed += 0.5;
        }
        // 점수 업데이트
        if(ball.x - ball.radius < 0) {
        // 컴퓨터 1점 획득
            enemy.score++;
            resetBall();
        } else if(ball.x + ball.radius > canvas.width){
        // 사용자 1점 획득
            user.score++;
            resetBall();
        }
    }

    // 게임 초기화 함수
    function animate() {
        if(!gameRunning) {
            return; // 일시 중지된 경우 애니메이션을 계속하지 마세요.
        }
        update();//공 위치 업데이트 함수 호출
        render();//게임 렌더링 함수 호출
        sendUserPosition(); // 유저 위치 전송 함수 호출
        animationId = requestAnimationFrame(animate);
    }

    //게임시작버튼
    startBtn.addEventListener("click", () => {
        if (!gameRunning) {
            gameRunning = true;
            animate();
        }
    });

    //점수판
    var resultValue = user.score + " : " + enemy.score;

    return (
        <div className="game-container">
            <canvas id="myCanvas"></canvas>
            <button className="start-btn">Start</button>
            <div id="score">
                <p>{resultValue}</p>
            </div>
        </div>
    );
}

export default NewPingPong;