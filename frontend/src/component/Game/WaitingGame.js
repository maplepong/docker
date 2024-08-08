/* @jsx myReact.createElement */
import myReact, { useEffect } from "../../core/myReact.js";
import HandleInviteModal from "../Navbar/HandelInviteModal.js";
import "../../css/match.css";

const WaitingGame = ({ gameInfo, startGame, exitGame }) => {
  let show = false;
  useEffect(() => {
    setShow();
  }, []);
  const setShow = () => {
    const modal = document.getElementsByClassName("modalContainer")[0];
    // const bg = document.getElementsByClassName("modal-background")[0];
    if (!modal) return;
    modal.classList.toggle("hidden");
    // modal.classList.toggle("hidden");
  };
  return (
    <div class="bg">
      <div class="room">
        <div class="room_header">
          <span class="room_title">{gameInfo.name} </span>
          <span class="locked">****</span>
          <span>
            <input type="button" class="pwdbtn" />
          </span>
        </div>
        <div class="game_interface">
          <div class="closebtn-section">
            <input type="button" class="closebtn" onClick={() => exitGame()} />
          </div>
          <div class="top-section">
            <div class="owner">
              {gameInfo.owner_info ? (
                <div>
                  <img src={gameInfo.owner_info.image} class="owner-img"></img>
                  <div class="owner_name">{gameInfo.owner_info.nickname}</div>
                  <div class="owner_stat">{gameInfo.owner_info.win_rate}</div>
                </div>
              ) : null}
            </div>
            <div class="logo-section">
              <input type="button" class="logo"></input>
              {gameInfo.owner === localStorage.getItem("nickname") ? (
                <div>
                  <input
                    type="button"
                    class="strbtn"
                    onClick={() => startGame()}
                  ></input>
                  <input
                    type="button"
                    class="invbtn"
                    onclick={() => {
                      setShow();
                    }}
                  ></input>
                  <HandleInviteModal setShow={setShow} type="game" />
                </div>
              ) : (
                <span>아무거또 모태</span>
              )}
            </div>
            <div class="player">
              {gameInfo.player_info && gameInfo.player_info.nickname ? (
                <div>
                  <img
                    src={gameInfo.player_info.image}
                    class="player-img"
                  ></img>
                  <div class="player_name">{gameInfo.player_info.nickname}</div>
                  <div class="player_stat">{gameInfo.player_info.win_rate}</div>
                </div>
              ) : (
                <div>
                  <div class="player-img"></div>
                  <div class="player_name">기다리는 중...</div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
      {/* <Chat gameId={gameInfo.id}/> */}
    </div>
  );
};

export default WaitingGame;
