/* @jsx myReact.createElement */
import myReact, { useEffect, useRef, useState } from "../../core/myReact.js";
import "../../css/Chat.css";
import NicknameModal from "../NicknameModal.js";
import socketController from "../../core/socket.js";
import { requestJoinGame } from "../../core/ApiGame.js";

const Chat = () => {
  const [messages, setMessages] = useState([]);

  const onMessageDefault = (data) => {
    const chat = document.getElementById("chat");
    console.log("chat data :", data);
    setMessages([
      ...messages,
      { type: data.type, sender: data.sender, message: data.message },
    ]);
    // chat.scrollTop= chat.scrollHeight;
  };
  const onMessageInvite = (data) => {
    const chat = document.getElementById("chat");
    console.log("chat data :", data);
    setMessages([
      ...messages,
      {
        sender: "system",
        type: "invite",
        message: `${data.sender} 님이 게임에 초대하셨습니다.`,
      },
      {
        sender: "system",
        type: "invite",
        gameId: data.gameId,
        message: `초대 메시지 : ${data.message}`,
      },
    ]);
  };

  useEffect(() => {
    socketController.initSocket();
    socketController.setSocketTypes([
      { type: "all", func: onMessageDefault },
      { type: "whisper", func: onMessageDefault },
      { type: "invite", func: onMessageInvite },
    ]);
  });

  // key: inputType
  // for send
  const msgTypeList = {
    "/all": { showtype: "<전체>", sendtype: "all" },
    "/w": { showtype: "<귓속말>", sendtype: "whisper" },
    "/game": { showtype: "<게임>", sendtype: "game" },
  };
  //inputType
  let msgType = "/all";
  let whisperTarget = "";
  const parseMsg = (e, currentInput) => {
    if (e.key === "Enter") {
      sendMessage(currentInput);
      e.target.value = "";
      return;
    }

    //귓속말 타겟
    //접속중인지 확인 불가능
    if (msgType === "/w" && e.key === " ") {
      whisperTarget = currentInput.trim().split(" ")[0];
      setMessageType("/w", whisperTarget);
      currentInput = currentInput.slice(whisperTarget.length);
      e.target.value = "";
    }

    //메시지 타입 변경 이벤트
    if (msgType === "/all") {
      var inputType = currentInput.split(" ")[0];
      if (currentInput[0] === "/" && msgTypeList[inputType]) {
        //메시지 타입 들어왔을 경우
        setMessageType(inputType);
        currentInput = currentInput.slice(msgType.length);
        e.target.value = "";
      }
      // 메시지 타입 지우기 이벤트
    } else if (e.key === "Backspace" || e.key === "Delete") {
      if (currentInput === "") {
        setMessageType("/all");
      }
    }
  };

  const chatLabel = document.getElementById("chat-label");
  const setMessageType = (inputType, target) => {
    console.log(inputType);
    chatLabel.innerText =
      msgTypeList[inputType].showtype + (target ? ` : ${target}에게` : "");
    msgType = inputType;
  };

  const sendMessage = (message) => {
    const data = {
      type: msgTypeList[msgType].sendtype,
      message: message,
      sender: localStorage.getItem("nickname"),
    };
    if (msgType === "/w") {
      data.receiver = whisperTarget;
    }
    socketController.sendMessage(data);
  };

  async function enterGame(gameId) {
    const res = await requestJoinGame(gameId, null);
    if (res.status === 201) {
      myReact.redirect(`gameroom/${gameId}`);
    } else alert("방 진입에 문제가 있습니다.");
  }
  useEffect(() => {
    const chat = document.getElementById("chat");
    chat.scrollTop = chat.scrollHeight;
  }, [messages]);

  return (
    <div id="container-chat">
      <div id="chat">
        <div id="messages">
          {messages.map((msg, index) => (
            <div key={index} class={msg.type + " message-container"}>
              <div class="chat-line">
                {msg.sender === "system" ? null : (
                  <NicknameModal nickname={msg.sender} />
                )}
                <p class="message">{msg.message}</p>
              </div>
              {msg.type === "invite" && msg.gameId ? (
                <button
                  class="acceptBtn"
                  onclick={() => {
                    enterGame(msg.gameId);
                  }}
                >
                  {" "}
                  초대 수락하기
                </button>
              ) : (
                ""
              )}
            </div>
          ))}
        </div>
      </div>
      <label for="chat-input" id="chat-label">
        {msgTypeList[msgType].showtype}
      </label>
      <input
        type="text"
        onKeyDown={(e) => {
          parseMsg(e, e.target.value);
        }}
        id="chat-input"
      ></input>
    </div>
  );
};

export default Chat;
