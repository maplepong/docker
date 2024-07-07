/* @jsx myReact.createElement */
import myReact, { Link } from "../core/myReact.js";
import { useState, useEffect } from "../core/myReact.js";

const Modal = ({ content, onClose }) => {
    return (
        // 친구 정보 표시 Modal
        <div id="modal">
            친구 정보
            <button onClick={onClose}>Close</button>
            <div>{content}</div>
            {/* 필요한 경우 추가 정보 표시 */}
        </div>
    );
}

export default Modal;