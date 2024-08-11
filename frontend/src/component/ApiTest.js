/* @jsx myReact.createElement */
import myReact, { useState, useEffect } from "../core/myReact.js";
import api from "../core/Api.js";

const ApiTest = () => {
  async function requestLogin() {
    const res = await api.login(() => {
      return ["test", "4545"];
    });
  }
  async function befriend() {}
  async function getRequestFriendList() {}
  async function okFriendList() {}
  async function deleteFriend() {}
  async function getInfo() {}
  async function patchInfo() {
    const changedValue = {
      nickname: "테스트",
    };
  }
  async function getImage() {
    const image = await api.userImage("GET");
    const imgContainer = document.querySelector("#testImg");
    if (image && image.image === null) {
      return alert("이미지가 없다!");
    }
    imgContainer.src = image.image;
  }

  const onFileChange = (e) => {
    const {
      target: { files },
    } = e;
    const filefile = files[0]; //우선 1개만 보여줄꺼니까 크기 1로 지정

    patchImage(filefile);
  };

  async function patchImage(FILE) {}

  async function validCheck() {
    const value = document.querySelector("#validinput").value;
  }

  return (
    <div>
      <button onclick={requestLogin}>login: test</button>
      <button
        onclick={() => {
          api.logout();
        }}
      >
        로그아웃
      </button>
      <button onclick={befriend}>친구요청: gyopark</button>
      <button onclick={getRequestFriendList}>getRequestFriendList</button>
      <button onclick={okFriendList}>ok to FriendRequest</button>
      <button onclick={deleteFriend}>니얼굴과 친구 끊기</button>
      <input id="validinput" placeholder="유효성체크할값"></input>
      <button onclick={validCheck}>위 값 유효성 체크</button>
      <button onclick={getInfo}>정보불러오기</button>
      <button onclick={patchInfo}>
        정보 패치: introduction 아니면 nickname 가능///바뀐것만 넣기
      </button>
      <button onclick={getImage}>사진불러오기</button>
      <img style="{width: 150px, height: 150px}" src="null" id="testImg"></img>
      <button onclick={patchImage}>이미지 패치해보기.. delete가 안됨..</button>
      <input
        type="file"
        accept="image/*"
        id="testUpload"
        onchange={onFileChange}
      ></input>
      <button
        onclick={() => {
          api.testRefresh();
        }}
      >
        test refresh
      </button>
    </div>
  );
};

export default ApiTest;
