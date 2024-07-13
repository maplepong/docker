/* @jsx myReact.createElement */
import myReact, { useState, useEffect } from "../core/myReact.js";
import "../css/Pingpong.css";
import api from "../core/Api_.js";

const PingPong = ({ gameinfo, gameSocket }) => {
  let ctx, ballRadius, x, y, dx, dy, canvas;
  let paddleHeight,
    paddleWidth,
    paddleX,
    rightPressed,
    leftPressed,
    enemyPaddleX;
  let isowner = false;
  let userscore, enemyscore;
  let flag = false;

  //
  useEffect(() => {
    if (!gameinfo || !gameSocket.current) {
      console.log("something is wrong...");
      return;
    }

    if (gameinfo.owner === localStorage.getItem("nickname")) isowner = true;

    // console.log("PingPong useEffect");
    // console.log("gameInfo:", gameinfo);
    // console.log("gameSocket.current:", gameSocket.current.readyState);

    canvas = document.getElementById("myCanvas");

    if (canvas && canvas.getContext) {
      ctx = canvas.getContext("2d");
      initGame(canvas);
      draw();

      gameSocket.current.onmessage = (event) => {
        const message = JSON.parse(event.data);
        handleSocketMessage(message);
      };

      gameSocket.current.onclose = () => {
        //t소켓이 끊겼음을 감지
        const message = JSON.stringify({
          type: "game_end",
          nickname: localStorage.getItem("nickname"),
        });
        console.log("gameSocket closed");
        window.history.back();
      };

      return () => {
        // clearInterval(interval);
        document.removeEventListener("keydown", keyDownHandler);
        document.removeEventListener("keyup", keyUpHandler);
      };
    } else {
      console.log("Canvas context not supported");
    }
  }, [score]);

  function handleSocketMessage(message) {
    if (message.type === "paddle_move") {
      const { data } = message;
      enemyPaddleX = data.x;
    } else if (message.type === "game_update") {
      const { ball, paddle } = message.data;
      if (ball && !isowner) {
        x = ball.x;
        y = ball.y;
        dx = ball.dx;
        dy = ball.dy;
      }
      if (paddle) {
        enemyPaddleX = paddle.x;
        console.log("cavnas", canvas.width, "paddle", paddle.x);
        console.log("enemypaddle:", enemyPaddleX);
      }
    }
  }

  function updateScore(leftAdd, rightAdd) {
    //스코어 업데이트
    userscore += leftAdd;
    enemyscore += rightAdd;
    if (userscore < 3 && enemyscore < 3) resetGame();
    else {
      api.sendGameResult(
        userscore,
        enemyscore,
        localStorage.getItem("nickname")
      );
      gameSocket.current.close();
      window.history.back();
    }
    return;
  }

  function initGame(newCanvas) {
    //게임 초기화화
    // console.log("initGame");
    ballRadius = 10;
    if (isowner) {
      x = newCanvas.width / 2;
      y = newCanvas.height / 2;
      dx = 2;
      dy = 2;
    }
    paddleHeight = 10;
    paddleWidth = 75;
    paddleX = (newCanvas.width - paddleWidth) / 2;
    userscore = 0;
    enemyscore = 0;
    enemyPaddleX = (newCanvas.width - paddleWidth) / 2;
    rightPressed = false;
    leftPressed = false;

    document.addEventListener("keydown", keyDownHandler, false);
    document.addEventListener("keyup", keyUpHandler, false);
  }

  function resetGame() {
    x = canvas.width / 2;
    y = canvas.height / 2;
    dx = 2;
    dy = 2;
    paddleX = (canvas.width - paddleWidth) / 2;
    flag = false;
    // enemyPaddleX = (canvas.width - paddleWidth) / 2;
    draw();
  }

  function drawBall() {
    ctx.beginPath();
    ctx.arc(x, y, ballRadius, 0, Math.PI * 2);
    ctx.fillStyle = "#0095DD";
    ctx.fill();
    ctx.closePath();
  }

  function drawPaddle() {
    ctx.beginPath();
    ctx.rect(paddleX, canvas.height - paddleHeight, paddleWidth, paddleHeight);
    ctx.fillStyle = "#0095DD";
    ctx.fill();
    ctx.closePath();
  }

  function drawEnemyPaddle() {
    ctx.beginPath();
    ctx.rect(enemyPaddleX, 0, paddleWidth, paddleHeight);
    ctx.fillStyle = "#0095DD";
    ctx.fill();
    ctx.closePath();
  }

  function keyDownHandler(e) {
    if (e.key === "Right" || e.key === "ArrowRight") {
      rightPressed = true;
    } else if (e.key === "Left" || e.key === "ArrowLeft") {
      leftPressed = true;
    }
  }

  function keyUpHandler(e) {
    if (e.key === "Right" || e.key === "ArrowRight") {
      rightPressed = false;
    } else if (e.key === "Left" || e.key === "ArrowLeft") {
      leftPressed = false;
    }
  }

  function drawText(text, x, y, color) {
    ctx.fillStyle = color;
    ctx.font = "45px fantasy";
    ctx.fillText(text, x, y);
  }

  function socketCloseCheck() {
    if (
      gameSocket.current &&
      gameSocket.current.readyState === WebSocket.OPEN
    ) {
      return true;
    }
    return false;
  }

  function draw() {
    if (!ctx) return;
    if (score && (score.left >= 3 || score.right >= 3)) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    drawBall();
    if (flag == false) {
      sendGameState();
      flag = true;
    }
    drawPaddle();
    drawEnemyPaddle();
    // 점수 표시
    drawText(userscore, canvas.width / 4, canvas.height / 5, "white");
    drawText(enemyscore, (3 * canvas.width) / 4, canvas.height / 5, "white");

    if (x + dx > canvas.width - ballRadius || x + dx < ballRadius) {
      dx = -dx;
    }
    if (y + dy > canvas.height - ballRadius) {
      if (x > paddleX && x < paddleX + paddleWidth) {
        dy = -dy;
        sendGameState();
      } else {
        updateScore(1, 0);
        return;
      }
    }
    if (y + dy < ballRadius) {
      if (x > enemyPaddleX && x < enemyPaddleX + paddleWidth) {
        dy = -dy;
        sendGameState();
      } else {
        updateScore(0, 1);
        return;
      }
    }

    if (rightPressed) {
      paddleX = Math.min(paddleX + 7, canvas.width - paddleWidth);
      sendGameState();
      // sendPaddlePosition();
    } else if (leftPressed) {
      paddleX = Math.max(paddleX - 7, 0);
      sendGameState();
      // sendPaddlePosition();
    }

    x += dx;
    y += dy;
    //sendGameState();
    interval = requestAnimationFrame(draw);
  }

  function sendPaddlePosition() {
    if (
      gameSocket.current &&
      gameSocket.current.readyState === WebSocket.OPEN
    ) {
      gameSocket.current.send(
        JSON.stringify({
          type: "paddle_move",
          data: { x: canvas.width - (paddleX + paddleWidth) },
          nickname: localStorage.getItem("nickname"),
        })
      );
    }
  }

  function sendGameState() {
    if (
      gameSocket.current &&
      gameSocket.current.readyState === WebSocket.OPEN
    ) {
      const data = {
        ball: { x: canvas.width - x, y: canvas.height - y, dx: -dx, dy: -dy },
        paddle: { x: canvas.width - (paddleX + paddleWidth) },
      };
      gameSocket.current.send(
        JSON.stringify({
          data: data,
          type: "game_update",
          nickname: localStorage.getItem("nickname"),
        })
      );
    }
  }

  var resultValue = score.left + " : " + score.right;
  if (score.left > 2 || score.right > 2) {
    resultValue =
      (score.left > score.right ? "left win by " : "right win by ") +
      resultValue;
  }

  return (
    <div id="score">
      {/* <p>{resultValue}</p> */}
      <canvas id="myCanvas" width="480" height="320"></canvas>
    </div>
  );
};

export default PingPong;
