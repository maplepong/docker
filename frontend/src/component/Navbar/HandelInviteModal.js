/* @jsx myReact.createElement */
import myReact, { useEffect, useRef, useState } from "../../core/myReact";
import socketController from "../../core/socket";
import "../../css/modal.css";

const HandleInviteModal = (props) => {
  const info = useRef({
    showType: props.type === "tournament" ? "토너먼트" : "게임",
    sendType: props.type === "tournament" ? "tournament_invite" : "game_invite",
    type: props.type,
    setShow: props.setShow,
  });
  const [message, setMessage] = useState("");

  let show = useRef(false);
  const setShow = (show) => {
    const modal = document.getElementsByClassName("modalContainer")[0];
    if (!modal) return;
    show ? modal.classList.add("hidden") : modal.classList.remove("hidden");
    show = !show;
  };

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
    <div>
      <button class="invite-button" onClick={() => setShow()}>
        초대하기
      </button>
      <div class={`modalContainer`}>
        <div class="modal-container">
          <div class="modal-header">
            <h3>{info.current.showType}에 초대하기</h3>
            <button onClick={() => setShow(show.current)}>X</button>
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
                const data =
                  props.type === "tournament"
                    ? {
                        type: info.current.sendType,
                        receiver: receiver,
                        sender: localStorage.getItem("nickname"),
                      }
                    : {
                        type: info.current.sendType,
                        receiver: receiver,
                        message: msg || "",
                        gameId: window.location.pathname.split("/")[2],
                        sender: localStorage.getItem("nickname"),
                      };
                console.log(data);
                socketController.sendMessage(data);
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
            setShow(show.current);
          }}
        />
      </div>
    </div>
  );
};
export default HandleInviteModal;
