/* @jsx myReact.createElement */
import myReact, { useState, useEffect, useRef } from "../../core/myReact.js";
import "../../css/Pingpong.css";
import api from "../../core/Api.js";

const PingPong = ({ gameinfo, gameSocket, gameResult, setStatus }) => {
  let isowner = false;
  let upPressed, downPressed;
  let flag = false;
  let playerPaddle, aiPaddle, ball, ballDirection;
  let userscore = useRef(0);
  let enemyscore = useRef(0);

  useEffect(() => {
    if (!gameinfo || !gameSocket.current) {
      console.log("something is wrong...");
      return;
    }

    if (gameinfo.owner === localStorage.getItem("nickname")) isowner = true;

    const canvas = document.getElementById("myCanvas");

    if (canvas) {
      // Three.js 초기 설정
      const scene = new THREE.Scene();
      scene.background = new THREE.Color("skyblue");

      const camera = new THREE.PerspectiveCamera(75, 480 / 320, 0.1, 1000);
      const renderer = new THREE.WebGLRenderer({ canvas: canvas });
      renderer.setSize(480, 320);

      const light = new THREE.DirectionalLight(0xffffff, 1);
      light.position.set(5, 5, 5).normalize();
      scene.add(light);

      camera.position.set(0, -2.5, 5);
      camera.lookAt(0, 0, 0);

      let ballRadius = 0.2;
      const ballGeometry = new THREE.SphereGeometry(ballRadius, 32, 32);
      const ballMaterial = new THREE.MeshPhongMaterial({ color: 0xffc0cb });
      ball = new THREE.Mesh(ballGeometry, ballMaterial);
      scene.add(ball);

      let paddleHeight = 1;
      let paddleWidth = 0.2;
      const paddleGeometry = new THREE.BoxGeometry(
        paddleWidth,
        paddleHeight,
        0.2
      );
      const paddleMaterial = new THREE.MeshPhongMaterial({ color: 0xffc0cb });

      playerPaddle = new THREE.Mesh(paddleGeometry, paddleMaterial);
      playerPaddle.position.x = -2;
      scene.add(playerPaddle);

      aiPaddle = new THREE.Mesh(paddleGeometry, paddleMaterial);
      aiPaddle.position.x = 2;
      scene.add(aiPaddle);

      if (localStorage.getItem("nickname") === gameinfo.owner) {
        ballDirection = new THREE.Vector3(0.04, 0.04, 0);
      } else {
        ballDirection = new THREE.Vector3(-0.04, 0.04, 0);
      }

      const fontLoader = new THREE.FontLoader();
      let font;

      fontLoader.load(
        "https://threejs.org/examples/fonts/helvetiker_regular.typeface.json",
        function (loadedFont) {
          font = loadedFont;
          drawText(
            userscore.current.toString() +
              " : " +
              enemyscore.current.toString(),
            -0.6,
            0,
            0xffffff
          );
        }
      );

      let textMesh;

      function drawText(text, x, y, color) {
        if (textMesh) {
          scene.remove(textMesh);
        }

        const textGeometry = new THREE.TextGeometry(text, {
          font: font,
          size: 0.5,
          height: 0.1,
        });
        const textMaterial = new THREE.MeshBasicMaterial({ color: color });
        textMesh = new THREE.Mesh(textGeometry, textMaterial);
        textMesh.position.set(x, y, 0);
        scene.add(textMesh);
      }

      function updateBall() {
        ball.position.add(ballDirection);

        if (ball.position.y >= 3 || ball.position.y <= -3) {
          ballDirection.y = -ballDirection.y;
          sendGameState();
        }
        if (
          ball.position.x - ballRadius <
          playerPaddle.position.x + paddleWidth / 2
        ) {
          if (
            ball.position.y > playerPaddle.position.y - paddleHeight / 2 &&
            ball.position.y < playerPaddle.position.y + paddleHeight / 2
          ) {
            ballDirection.x = -ballDirection.x;
            sendGameState();
          } else {
            updateScore(1, 0);
            sendGameState();
            drawText(
              userscore.current.toString() +
                " : " +
                enemyscore.current.toString(),
              -0.6,
              0,
              0xff0000
            );
          }
        }

        if (
          ball.position.x + ballRadius >=
          aiPaddle.position.x - paddleWidth / 2
        ) {
          if (
            ball.position.y >= aiPaddle.position.y - paddleHeight / 2 &&
            ball.position.y <= aiPaddle.position.y + paddleHeight / 2
          ) {
            ballDirection.x = -ballDirection.x;
            sendGameState();
          } else {
            updateScore(0, 1);
            sendGameState();
            drawText(
              userscore.current.toString() +
                " : " +
                enemyscore.current.toString(),
              -0.6,
              0,
              0x0000ff
            );
          }
        }
      }

      document.addEventListener("keydown", keyDownHandler, false);
      document.addEventListener("keyup", keyUpHandler, false);

      function updatePlayerPaddle() {
        if (upPressed) {
          playerPaddle.position.y += 0.1;
          sendGameState();
        } else if (downPressed) {
          playerPaddle.position.y -= 0.1;
          sendGameState();
        }
      }

      function animate() {
        requestAnimationFrame(animate);

        updateBall();

        updatePlayerPaddle();

        renderer.render(scene, camera);
      }
      animate();

      gameSocket.current.onmessage = (event) => {
        const message = JSON.parse(event.data);
        handleSocketMessage(message);
      };

      gameSocket.current.onclose = () => {
        const message = JSON.stringify({
          type: "game_end",
          nickname: localStorage.getItem("nickname"),
        });
        console.log("gameSocket closed");
        myReact.redirect("home"); //변경 필요
      };

      return () => {
        document.removeEventListener("keydown", keyDownHandler);
        document.removeEventListener("keyup", keyUpHandler);
      };
    } else {
      console.log("Canvas context not supported");
    }
  }, [gameinfo, gameSocket.current]);

  function handleSocketMessage(message) {
    if (message.type === "paddle_move") {
      const { data } = message;
      aiPaddle = data.x;
    } else if (message.type === "game_update") {
      const { socketball, paddle, uscore } = message.data;
      if (socketball && !isowner) {
        ball.position.x = socketball.x;
        ball.position.y = socketball.y;
        ballDirection.x = socketball.dx;
        ballDirection.y = socketball.dy;
      }
      if (paddle) {
        aiPaddle.position.y = paddle.y;
      }
      if (uscore && !isowner) {
        userscore.current = uscore.y;
        enemyscore.current = uscore.x;
      }
    }
  }

  function resetBall() {
    ball.position.set(0, 0, 0);
  }

  function updateScore(leftAdd, rightAdd) {
    //스코어 업데이트
    userscore.current += leftAdd;
    enemyscore.current += rightAdd;
    sendGameState();
    if (userscore.current < 3 && enemyscore.current < 3) resetBall();
    else {
      api.sendGameResult(
        userscore.current,
        enemyscore.current,
        localStorage.getItem("nickname")
      );
      gameSocket.current.close();
      gameResult.current = {
        userscore: userscore.current,
        enemyscore: enemyscore.current,
      };
      setStatus(3); //status.finished
      // myReact.redirect("home");
    }
    return;
  }

  function sendGameState() {
    if (
      gameSocket.current &&
      gameSocket.current.readyState === WebSocket.OPEN
    ) {
      const data = {
        socketball: {
          x: -ball.position.x,
          y: ball.position.y,
          dx: -ballDirection.x,
          dy: ballDirection.y,
        },
        paddle: { x: -playerPaddle.position.x, y: playerPaddle.position.y },
        uscore: { x: userscore.current, y: enemyscore.current },
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

  function keyDownHandler(e) {
    if (e.key === "W" || e.key === "w") {
      upPressed = true;
    } else if (e.key === "S" || e.key === "s") {
      downPressed = true;
    }
  }

  function keyUpHandler(e) {
    if (e.key === "w" || e.key === "W") {
      upPressed = false;
    } else if (e.key === "s" || e.key === "S") {
      downPressed = false;
    }
  }

  return <div id="score"></div>;
};

export default PingPong;
