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

  //key: inputType
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
      chatSocket.current.send(
        JSON.stringify({
          type: msgType,
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
