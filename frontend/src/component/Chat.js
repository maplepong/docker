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
    // if !(data.type) return console.error("ws data type이 없습니다.");
    // switch (data.type) {

    // }
    setMessages([...messages, { sender: data.sender, message: data.message }]);
  };

  const sendMessage = (message) => {
    if (
      chatSocket.current &&
      chatSocket.current.readyState === WebSocket.OPEN
    ) {
      chatSocket.current.send(
        JSON.stringify({
          type: "all",
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
      <input
        type="text"
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            sendMessage(e.target.value);
            e.target.value = "";
          }
        }}
      />
    </div>
  );
};

export default Chat;
