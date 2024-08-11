/* @jsx myReact.createElement */
import myReact, { Link, useEffect } from "../core/myReact.js";
import api from "../core/Api.js";

const ApiLogin = () => {
  const api_link =
    "https://api.intra.42.fr/oauth/authorize?client_id=u-s4t2ud-da15e1c7ef76e1c919d318b024eaf492d23793d93fabe249be7b160a5c7a0fa0&redirect_uri=https%3A%2F%2Flocalhost%3A443%2Fapi-login&response_type=code";

  const redirect = async () => {
    window.location.href = api_link;
  };
  const getCode = () => {
    const url = window.location.href;
    const code = url.split("code=")[1];
    return code;
  };

  if (!getCode()) useEffect( redirect, []);

  const code = getCode();
  if (code) {
    api
      .request42ApiLogin(code)
      .then((response) => {})
      .catch((error) => {
        return;
      });
  }
  return (
    <div id="api-login-container">
      <p>42 login</p>
    </div>
  );
};

export default ApiLogin;
