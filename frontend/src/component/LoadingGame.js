/* @jsx myReact.createElement */
import myReact from "../core/myReact.js";

const Loading = (type) => {
  if (type === "game") {
    return (
      <div id="loadingContainer">
        <h2>Game Loading...</h2>
      </div>
    );
  }
  else if (type === "tournament") {
    return (
      <div id="loadingContainer">
        <h2>Tournament Loading...</h2>
      </div>
    );
  }
  else 
  return (
    <div id="loadingContainer">
      <h2>nothing Loading...</h2>
    </div>
  );
};

export default Loading;
