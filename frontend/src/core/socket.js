const SocketController = () => {
  return {
    // socket을 init할 함수
    // socket의 onmessage를 추가할 함수 *
    _ws: { current: null },
    _messageTypes: { current: {} }, // item: {type:string, func:function}

    // chat 컴포넌트 안에서 사용할 setstate를 받아서 세팅해주는 함수
    // item: {type:string, func:function}
    // 이후 업데이트한 타입/ 함수를 반영한 getMessage로 onmessage 함수를 변경
    setSocketTypes: function setSocketTypes(items) {
      items.forEach((item) => {
        this._messageTypes.current[item.type] = item.func;
      });
      this._ws.current.onmessage = (e) => this._getMessage(e);
    },
    // onmessage에서 사용할 함수
    // 실행시에 messageTypes에 있는 type을 가지고 확인
    // 해당 type은 chat / tournament / friend 가 불려질 때 각자 추가할 것
    _getMessage: function getMessage(e) {
      const data = JSON.parse(e.data);
      console.log("ws: data :", data);
      // 귓속말 / 전체 채팅 / 초대  / 친구 접속 상태 받기 요청 (접속자 → 서버) / 친구 접속 상태 업데이트 (서버 → 다수)
      if (!data.type) return console.error("ws: data type이 없습니다.");
      for (const type in this._messageTypes.current) {
        const data = JSON.parse(e.data);
        if (data.type === type) {
          this._messageTypes.current[type](data);
          return;
        }
      }
      console.error("ws 메시지를 받았으나 알 수 없는 타입입니다.", data);
    },

    // 메시지를 보내는 함수
    // 무조건 타입 필요
    sendMessage: function sendMessage({ type, ...rest }) {
      if (this._ws.current && this._ws.current.readyState === WebSocket.OPEN) {
        // console.log("sending data", type, ...rest);
        if (!type) return console.error("type이 없습니다.");
        const data = {
          type: type,
          sender: localStorage.getItem("nickname"),
          ...rest,
        };
        this._ws.current.send(JSON.stringify(data));
        this._ws.current.onmessage = (event) => this._getMessage(event);
      } else {
        alert("socket이 연결되지 않았습니다.");
      }
    },

    // 첫 사용을 위한 연결
    // 이미 연결되어있으면 리턴
    initSocket: function initSocket() {
      console.log("initSocket", this._ws.current);
      if (this._ws.current) return this._ws.current; // 이미 연결되어있으면 리턴
      this._ws.current = new WebSocket(`wss://localhost:443/ws/socket/`, [
        "token",
        localStorage.getItem("accessToken"),
      ]);
      this._ws.current.onopen = () => {
        console.log("chat socket opened");
        this._ws.current.send(
          JSON.stringify({
            type: "connect",
            message: "chat connected",
            sender: localStorage.getItem("nickname"),
          })
        );
      };
      this._ws.current.onmessage = (e) => this._getMessage(e);
      this._ws.current.onclose = () => {
        console.error("전체 웹소켓 연결이 중지되었습니다.");
        this._ws.current = null;
      };
      return this._ws;
    },

    // function setSocket
  };
};

export default SocketController();
