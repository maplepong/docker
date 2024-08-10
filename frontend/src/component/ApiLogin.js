/* @jsx myReact.createElement */
import myReact, { Link, useEffect } from "../core/myReact.js";
import api from "../core/Api.js";

const ApiLogin = () => {
  const api_link =
    "https://api.intra.42.fr/oauth/authorize?client_id=u-s4t2ud-da15e1c7ef76e1c919d318b024eaf492d23793d93fabe249be7b160a5c7a0fa0&redirect_uri=https%3A%2F%2Flocalhost%3A443%2Fapi-login&response_type=code";

  const redirect = async () => {
    console.log("redirect입니당");
    window.location.href = api_link;
  };
  const getCode = () => {
    const url = window.location.href;
    const code = url.split("code=")[1];
    console.log("get code()");
    console.log("url:", url);
    return code;
  };

  if (!getCode()) useEffect( redirect, []);

  const code = getCode();
  if (code) {
    api
      .request42ApiLogin(code)
      .then((response) => {
        console.log("response:", response);
      })
      .catch((error) => {
        console.error("로그인 요청 중 오류 발생:", error);
        return;
      });
  } else console.log("code is null");
  return (
    <div id="api-login-container">
      <p>42 login</p>
    </div>
  );
};

export default ApiLogin;
