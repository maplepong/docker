/* @jsx myReact.createElement */
import myReact, { useEffect, useRef, useState } from "../core/myReact.js";
import "../css/Chat.css";
import NicknameModal from "./NicknameModal.js";
import socketController from "../core/socket.js";

const Chat = () => {
  const [messages, setMessages] = useState([
    {
      message: "방가방가^^",
      type: "all",
      sender: "시우리",
    },
    {
      message: "하이루 - 오늘뭐함",
      type: "all",
      sender: "교park",
    },
    {
      message: "즐겜;; 가야겠다",
      type: "all",
      sender: "subcho",
    },
    {
      message: "<system> WONS2님이 게임에 초대했습니다!",
      type: "invite",
      sender: "<<system>>",
    },
    {
      message: "<<나를 부르는 회사>> 로...",
      type: "all",
      sender: "subcho",
    },
  ]);
  const chatSocket = null;

  const onMessageDefault = (data) => {
    const chat = document.getElementById("chat");
    console.log("chat data :", data);
    setMessages([
      ...messages,
      { type: data.type, sender: data.sender, message: data.message },
    ]);
    chat.scrollTop(chat.prop("scrollHeight"));
  };
  const onMessageInvite = (data) => {
    const chat = document.getElementById("chat");
    console.log("chat data :", data);
    setMessages([
      ...messages,
      {
        sender: "system",
        gameId: data.gameId,
        message: `${data.sender} 님이 게임에 초대하셨습니다.`,
      },
      {
        sender: "system",
        gameId: data.gameId,
        message: `초대 메시지 : ${data.message}`,
      },
    ]);
    chat.scrollTop(chat.prop("scrollHeight"));
  };
  const onMessageConnect = (data) => {
    const chat = document.getElementById("chat");
    console.log("chat data :", data);
    setMessages([
      ...messages,
      {
        sender: "system",
        message: `접속되었습니다. 현재 친구들 : ${data.friends}`,
      },
    ]);
    chat.scrollTop(chat.prop("scrollHeight"));
  };
  const onMessageUpdate = (data) => {
    const chat = document.getElementById("chat");
    console.log("chat data :", data);
    setMessages([
      ...messages,
      {
        sender: "system",
        message: `${data.sender} 님이 ${
          data.status === "on" ? "접속" : "접속종료"
        }하셨습니다.`,
      },
    ]);
    chat.scrollTop(chat.prop("scrollHeight"));
  };

  useEffect(() => {
    if (!chatSocket) {
      chatSocket = socketController.initSocket();
    }
    socketController.setSocketTypes([
      { type: "chat", func: onMessageDefault },
      { type: "whisper", func: onMessageDefault },
      { type: "invite", func: onMessageInvite },
      { type: "connect", func: onMessageConnect },
      { type: "update", func: onMessageUpdate },
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
    if (
      chatSocket.current &&
      chatSocket.current.readyState === WebSocket.OPEN
    ) {
      console.log(msgTypeList[msgType], message);
      const data = {
        type: msgTypeList[msgType].sendtype,
        message: message,
        sender: localStorage.getItem("nickname"),
      };
      if (msgType === "/w") {
        data.receiver = whisperTarget;
      }
      chatSocket.current.send(JSON.stringify(data));
      chatSocket.current.onmessage = (event) => getMessage(event);
    } else {
      alert("socket이 연결되지 않았습니다.");
    }
  };
  console.log(messages);

  return (
    <div id="container-chat">
      <div id="chat">
        <div id="messages">
          {messages.map((msg, index) => (
            <div key={index} class={msg.type + " message-container"}>
              <NicknameModal nickname={msg.sender + " : "} />
              <p class="message">{msg.message}</p>
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
