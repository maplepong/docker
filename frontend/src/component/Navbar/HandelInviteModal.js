/* @jsx myReact.createElement */
import myReact, { useEffect, useState } from "../../core/myReact";
import socketController from "../../core/socket";
import "../../css/modal.css";

const HandleInviteModal = ({ setShow, type }) => {
  const showType = type === "tournament" ? "토너먼트" : "게임";
  const sendType = type === "tournament" ? "tournament_invite" : "game_invite";
  const [message, setMessage] = useState("");

  useEffect(() => {
    socketController.initSocket();
    socketController.setSocketTypes([
      {
        type: "tournament_invite_message",
        func: function (data) {
          onInviteMessage(data);
        },
      },
      {
        type: "game_invite_message",
        func: function (data) {
          onInviteMessage(data);
        },
      },
    ]);
  }, [message]);

  const onInviteMessage = (data) => {
    setMessage(data.message || "전송 오류입니다. 다시 시도해주세요.");
  };

  return (
    <div class={`modalContainer`}>
      <div class="modal-container">
        <div class="modal-header">
          <h3>{showType}에 초대하기</h3>
          <button onClick={setShow}>X</button>
        </div>
        <div class="modal-content">
          <input type="text" placeholder="닉네임을 입력해주세요"></input>
          <input type="text" placeholder="초대 메시지를 입력해주세요"></input>
          <button
            type="submit"
            onClick={(e) => {
              e.preventDefault();
              const target =
                document.getElementsByClassName("modal-content")[0];
              if (!target.children[0].value) {
                setMessage("닉네임을 입력해주세요.");
                return;
              }
              const receiver = target.children[0].value;
              const msg = target.children[1].value || "";
              console.log(receiver, msg);
              socketController.sendMessage({
                type: sendType,
                receiver: receiver,
                message: msg || "",
                gameId: window.location.pathname.split("/")[2],
                sender: localStorage.getItem("nickname"),
              });
              setMessage("로딩중입니다...");
            }}
          >
            초대하기
          </button>
          <p id={"modal-message"}>{message}</p>
        </div>
      </div>
      <div
        class={"modal-background"}
        onclick={() => {
          setShow();
        }}
      />
    </div>
  );
};
export default HandleInviteModal;
