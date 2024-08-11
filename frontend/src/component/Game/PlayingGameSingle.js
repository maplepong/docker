/* @jsx myReact.createElement */
import myReact, { useState, useEffect } from "../../core/myReact.js";
import "../../css/Pingpong.css";
import "../../core/Router.js";
import { redirect } from "statuses";
// import api from "../../core/Api.js";

const SingleGameRoom = () => {
  return (
    <div class="game-container">
      <canvas
        id="myCanvas"
        width="800"
        height="1200"
        class="singleCanvas"
      ></canvas>
      <PingPong />
    </div>
  );
};

const PingPong = () => {
  let upPressed, downPressed;
  let enemyupPressed, enemydownPressed;

  useEffect(() => {
    const canvas = document.getElementById("myCanvas");

    if (canvas) {
      // Three.js 초기 설정
      const scene = new THREE.Scene();
      scene.background = new THREE.Color("skyblue");

      const camera = new THREE.PerspectiveCamera(75, 640, 640, 0.1, 1000);
      const renderer = new THREE.WebGLRenderer({ canvas: canvas });
      renderer.setSize(640, 640);

      const light = new THREE.DirectionalLight(0xffffff, 1);
      light.position.set(5, 5, 5).normalize();
      scene.add(light);

      camera.position.set(0, -2.5, 5);
      camera.lookAt(0, 0, 0);

      let ballRadius = 0.2;
      const ballGeometry = new THREE.SphereGeometry(ballRadius, 32, 32);
      const ballMaterial = new THREE.MeshPhongMaterial({ color: 0xffc0cb });
      const ball = new THREE.Mesh(ballGeometry, ballMaterial);
      scene.add(ball);

      let paddleHeight = 1;
      let paddleWidth = 0.2;
      const paddleGeometry = new THREE.BoxGeometry(
        paddleWidth,
        paddleHeight,
        0.2
      );
      const paddleMaterial = new THREE.MeshPhongMaterial({ color: 0xffc0cb });

      const playerPaddle = new THREE.Mesh(paddleGeometry, paddleMaterial);
      playerPaddle.position.x = -2;
      scene.add(playerPaddle);

      const aiPaddle = new THREE.Mesh(paddleGeometry, paddleMaterial);
      aiPaddle.position.x = 2;
      scene.add(aiPaddle);

      let ballDirection = new THREE.Vector3(0.04, 0.04, 0);

      let leftscore = 0;
      let rightscore = 0;

      const fontLoader = new THREE.FontLoader();
      let font;

      fontLoader.load(
        "https://threejs.org/examples/fonts/helvetiker_regular.typeface.json",
        function (loadedFont) {
          font = loadedFont;
          drawText(
            leftscore.toString() + " : " + rightscore.toString(),
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

      function resetBall() {
        ball.position.set(0, 0, 0);
        ballDirection.set(0.04, 0.04, 0);
      }

      function updateBall() {
        ball.position.add(ballDirection);
        ``;
        if (ball.position.y >= 3 || ball.position.y <= -3) {
          ballDirection.y = -ballDirection.y;
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
          } else {
            rightscore++;
            // if (rightscore >= 3)
            //     cancel();
            drawText(
              leftscore.toString() + " : " + rightscore.toString(),
              -0.6,
              0,
              0xff0000
            );
            resetBall();
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
          } else {
            leftscore++;
            // if (leftscore >= 3)
            //     cancel();
            drawText(
              leftscore.toString() + " : " + rightscore.toString(),
              -0.6,
              0,
              0x0000ff
            );
            resetBall();
          }
        }
      }

      const cancel = () => {
        myReact.redirect("home");
        window.cancelAnimationFrame(animate);
        document.removeEventListener("keydown", keyDownHandler);
        document.removeEventListener("keyup", keyUpHandler);
        document.removeEventListener("keydown", enemykeyDownHandler);
        document.removeEventListener("keyup", enemykeyUpHandler);
      };

      document.addEventListener("keydown", keyDownHandler, false);
      document.addEventListener("keyup", keyUpHandler, false);
      document.addEventListener("keydown", enemykeyDownHandler, false);
      document.addEventListener("keyup", enemykeyUpHandler, false);

      function updatePlayerPaddle() {
        if (upPressed && playerPaddle.position.y <= 3) {
          playerPaddle.position.y += 0.1;
        } else if (downPressed && playerPaddle.position.y >= -3) {
          playerPaddle.position.y -= 0.1;
        }
      }

      function updateaiPaddle() {
        if (enemyupPressed && aiPaddle.position.y <= 3) {
          aiPaddle.position.y += 0.1;
        } else if (enemydownPressed && aiPaddle.position.y >= -3) {
          aiPaddle.position.y -= 0.1;
        }
      }

      function animate() {
        if (leftscore < 3 && rightscore < 3) {
          requestAnimationFrame(animate);

          updateBall();

          updatePlayerPaddle();
          updateaiPaddle();

          renderer.render(scene, camera);
        } else {
          alert("left Score: " + leftscore + " right Score: " + rightscore);
          cancel();
        }
      }

      animate();
    }
  }, []);

  function keyUpHandler(e) {
    if (e.key === "q" || e.key === "Q") {
      upPressed = false;
    } else if (e.key === "a" || e.key === "A") {
      downPressed = false;
    }
  }
  function keyDownHandler(e) {
    if (e.key === "q" || e.key === "Q") {
      upPressed = true;
    } else if (e.key === "a" || e.key === "A") {
      downPressed = true;
    }
  }

  function enemykeyUpHandler(e) {
    if (e.key === "e" || e.key === "E") {
      enemyupPressed = false;
    } else if (e.key === "d" || e.key === "D") {
      enemydownPressed = false;
    }
  }
  function enemykeyDownHandler(e) {
    if (e.key === "e" || e.key === "E") {
      enemyupPressed = true;
    } else if (e.key === "d" || e.key === "D") {
      enemydownPressed = true;
    }
  }

  return <div id="score"></div>;
};

export default SingleGameRoom;
