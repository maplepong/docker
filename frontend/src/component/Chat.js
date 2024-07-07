/* @jsx myReact.createElement */
import myReact, { useEffect, useRef, useState } from "../core/myReact.js";
import "../css/Chat.css";
import NicknameModal from "./NicknameModal.js";

const Chat = () => {
  const [messages, setMessages] = useState([]);
  const chatSocket = useRef(null);

  console.log(chatSocket.current);
  useEffect(() => {
    console.log(chatSocket.current);
    if (!chatSocket.current) chatSocket.current = initSocket();
    else {
      chatSocket.current.onmessage = (event) => getMessage(event);
    }
    return () => {
      if (chatSocket.current) {
        chatSocket.current.close();
        chatSocket.current = null;
      }
    };
  });

  function initSocket() {
    var ws = new WebSocket(`wss://localhost:443/ws/socket/`, [
      "token",
      localStorage.getItem("accessToken"),
    ]);
    ws.onopen = () => {
      console.log("chat socket opened");
      ws.send(
        JSON.stringify({
          type: "connect",
          message: "chat connected",
          sender: localStorage.getItem("nickname"),
        })
      );
    };
    ws.onmessage = (event) => getMessage(event);
    ws.onclose = () => {
      console.log("채팅 연결 종료");
      ws = null;
    };
    return ws;
  }
  const getMessage = (event) => {
    const data = JSON.parse(event.data);
    console.log("chat data :", data);
    // 귓속말 / 전체 채팅 / 초대  / 친구 접속 상태 받기 요청 (접속자 → 서버) / 친구 접속 상태 업데이트 (서버 → 다수)
    // if !(data.type) return console.error("ws data type이 없습니다.");
    // switch (data.type) {

    // }
    setMessages([...messages, { sender: data.sender, message: data.message }]);
  };

  const msgTypeList = {
    "/all": "<전체>",
    "/w": "<귓속말>",
    "/game": "<초대>",
  };
  let msgType = "/all";
  const parseMsg = (e, currentInput) => {
    if (e.key === "Enter") {
      sendMessage(currentInput, msgType);
      e.target.value = "";
      return;
    }
    if (msgType === "/all" && currentInput[0] === "/") {
      var type = currentInput.split(" ")[0];
      if (msgTypeList[type]) {
        msgType = type;
        setMessageType(msgType);
        currentInput = currentInput.slice(msgType.length);
        e.target.value = "";
      }
    } else if (e.key === "Backspace" || e.key === "Delete") {
      if (currentInput === "") {
        msgType = "/all";
        setMessageType(msgType);
      }
    }
  };

  const chatLabel = document.getElementById("chat-label");
  const setMessageType = (msgType) => {
    console.log(msgType);
    chatLabel.innerText = msgTypeList[msgType];
  };

  const sendMessage = (message) => {
    if (
      chatSocket.current &&
      chatSocket.current.readyState === WebSocket.OPEN
    ) {
      chatSocket.current.send(
        JSON.stringify({
          type: msgTypeList[msgType],
          message: message,
          sender: localStorage.getItem("nickname"),
        })
      );
      chatSocket.current.onmessage = (event) => getMessage(event);
    } else {
      alert("socket이 연결되지 않았습니다.");
    }
  };
  console.log(messages);

  return (
    <div id="container-chat">
      <div id="chat-list">
        <button>전체</button>
      </div>
      <div id="chat">
        <div id="messages">
          {messages.map((msg, index) => (
            <div key={index} class="message-container">
              <NicknameModal nickname={msg.sender} />
              <p class="message">{msg.message}</p>
            </div>
          ))}
        </div>
      </div>
      <label for="chat-input" id="chat-label">
        {msgTypeList[msgType]}
      </label>
      <input
        type="text"
        onKeyDown={(e) => {
          parseMsg(e, e.target.value);
        }}
        id="chat-input"
      />
    </div>
  );
};

export default Chat;
