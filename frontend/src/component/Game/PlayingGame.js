/* @jsx myReact.createElement */
import myReact, { useState, useEffect, useRef } from "../../core/myReact.js";
import "../../css/Pingpong.css";
import api from "../../core/Api.js";
import { keyDownHandler, keyUpHandler } from "./utils.js";

const PingPong = ({ gameinfo, gameSocket, gameResult, setStatus }) => {
  let isowner = false;
  let upPressed, downPressed;
  let playerPaddle, aiPaddle, ball, ballDirection;
  let userscore = useRef(0);
  let enemyscore = useRef(0);
  const three = {};

  function updateBall() {
    ball.position.add(ballDirection);

    if (ball.position.y >= 3 || ball.position.y <= -3) {
      ballDirection.y = -ballDirection.y;
      sendGameState();
    }
    if (
      ball.position.x - three.ballRadius <
      playerPaddle.position.x + three.paddleWidth / 2
    ) {
      if (
        ball.position.y > playerPaddle.position.y - three.paddleHeight / 2 &&
        ball.position.y < playerPaddle.position.y + three.paddleHeight / 2
      ) {
        ballDirection.x = -ballDirection.x;
        sendGameState();
      } else {
        updateScore(1, 0);
        sendGameState();
        drawText(
          userscore.current.toString() + " : " + enemyscore.current.toString(),
          -0.6,
          0,
          0xff0000
        );
      }
    }

    if (
      ball.position.x + three.ballRadius >=
      aiPaddle.position.x - three.paddleWidth / 2
    ) {
      if (
        ball.position.y >= aiPaddle.position.y - three.paddleHeight / 2 &&
        ball.position.y <= aiPaddle.position.y + three.paddleHeight / 2
      ) {
        ballDirection.x = -ballDirection.x;
        sendGameState();
      } else {
        updateScore(0, 1);
        sendGameState();
        drawText(
          userscore.current.toString() + " : " + enemyscore.current.toString(),
          -0.6,
          0,
          0x0000ff
        );
      }
    }
  }

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
    if (userscore.current < 3 && enemyscore.current < 3) {
      window.requestAnimationFrame(animate);

      updateBall();

      updatePlayerPaddle();

      three.renderer.render(three.scene, three.camera);
    }
  }

  const cancel = () => {
    window.cancelAnimationFrame(animate);
    document.removeEventListener("keydown", keyDownHandler);
    document.removeEventListener("keyup", keyUpHandler);
  };

  function drawText(text, x, y, color) {
    if (three.textMesh) {
      three.scene.remove(three.textMesh);
    }

    const textGeometry = new THREE.TextGeometry(text, {
      font: three.font,
      size: 0.5,
      height: 0.1,
    });
    const textMaterial = new THREE.MeshBasicMaterial({ color: color });
    three.textMesh = new THREE.Mesh(textGeometry, textMaterial);
    three.textMesh.position.set(x, y, 0);
    three.scene.add(three.textMesh);
  }

  useEffect(() => {
    if (!gameinfo || !gameSocket.current) {
      console.log("something is wrong...");
      return;
    }

    if (gameinfo.owner === localStorage.getItem("nickname")) isowner = true;

    const canvas = document.getElementById("myCanvas");

    if (canvas) {
      // Three.js 초기 설정
      three.scene = new THREE.Scene();
      three.scene.background = new THREE.Color("skyblue");

      three.camera = new THREE.PerspectiveCamera(75, 480 / 320, 0.1, 1000);
      three.renderer = new THREE.WebGLRenderer({ canvas: canvas });
      three.renderer.setSize(480, 320);

      three.light = new THREE.DirectionalLight(0xffffff, 1);
      three.light.position.set(5, 5, 5).normalize();
      three.scene.add(three.light);

      three.camera.position.set(0, -2.5, 5);
      three.camera.lookAt(0, 0, 0);

      three.ballRadius = 0.2;
      three.ballGeometry = new THREE.SphereGeometry(three.ballRadius, 32, 32);
      three.ballMaterial = new THREE.MeshPhongMaterial({ color: 0xffc0cb });
      ball = new THREE.Mesh(three.ballGeometry, three.ballMaterial);
      three.scene.add(ball);

      three.paddleHeight = 1;
      three.paddleWidth = 0.2;
      three.paddleGeometry = new THREE.BoxGeometry(
        three.paddleWidth,
        three.paddleHeight,
        0.2
      );
      three.paddleMaterial = new THREE.MeshPhongMaterial({ color: 0xffc0cb });

      playerPaddle = new THREE.Mesh(three.paddleGeometry, three.paddleMaterial);
      playerPaddle.position.x = -2;
      three.scene.add(playerPaddle);

      aiPaddle = new THREE.Mesh(three.paddleGeometry, three.paddleMaterial);
      aiPaddle.position.x = 2;
      three.scene.add(aiPaddle);

      if (localStorage.getItem("nickname") === gameinfo.owner) {
        ballDirection = new THREE.Vector3(0.04, 0.04, 0);
      } else {
        ballDirection = new THREE.Vector3(-0.04, 0.04, 0);
      }

      three.fontLoader = new THREE.FontLoader();
      three.font = null;

      three.fontLoader.load(
        "https://threejs.org/examples/fonts/helvetiker_regular.typeface.json",
        function (loadedFont) {
          three.font = loadedFont;
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

      three.textMesh = null;

      document.addEventListener("keydown", keyDownHandler, false);
      document.addEventListener("keyup", keyUpHandler, false);

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
        setStatus(3); //변경 필요
      };
      animate();
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
      gameSocket.current ? gameSocket.current.close() : null;
      gameResult.current = {
        userscore: userscore.current,
        enemyscore: enemyscore.current,
      };
      // if (stopRef.current) stopRef.current();
      cancel();
      // window.cancelAnimationFrame(animate);
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

  return <div id="score"></div>;
};

export default PingPong;
