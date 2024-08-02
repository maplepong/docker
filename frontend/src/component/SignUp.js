/* @jsx myReact.createElement */
import myReact from "../core/myReact.js";
import api, { requestSignup, requestValidCheck } from "../core/Api.js";
import "../css/Signup.css"
import { Link } from "../core/myReact.js";
import router from "../core/Router.js";

const SignUp = () => {
    let time;
    var CorrectPin = false;
    var Confirm = false;
    async function getInfo () {
        // 검증 로직
        if (!validateFields()) {
            alert("입력값들을 다시 확인해주세요!");
            return ;
        }

        const username = document.querySelector("#new-username").value;
        const nickname = document.querySelector("#new-nickname").value;
        const password = document.querySelector("#new-password").value;
        const confirmPassword = document.querySelector("#confirm-password").value;
        const email = document.querySelector("#new-mail").value;

        if (password !== confirmPassword) {
            alert("비밀번호를 다시 확인해주세요!");
            return;
        }
        
        const response = await api.signup(username, password, nickname, email);
    
        if (response.status !== 201) {
            alert("회원가입에 실패했습니다. Error: " + response.status);
            return ;
        }
        else {
            alert(username + "의 회원가입 완료")
        };
        myReact.redirect("/");
    }

    const validateFields = () => {
        const usernameValid = validcheckUsername();
        const nicknameValid = validcheckNickname();
        const emailValid = validcheckEmail();
        const passwordValid = handlePasswordInput();
        
        return usernameValid && Confirm && nicknameValid && emailValid && CorrectPin;
    }

    async function validcheckUsername() {
        const username = document.querySelector("#new-username").value;
        const errorDisplay = document.querySelector("#p-id-error");
        if (!username) {
            errorDisplay.innerHTML = "";
            return false;
        }
        const response = await api.validCheck("username", username);
        if (response.status !== 200) {
            errorDisplay.innerHTML = "이미 사용 중인 아이디입니다.";
            return false;
        } else {
            errorDisplay.innerHTML = "사용 가능한 아이디입니다.";
            return true;
        }
    }

    async function validcheckNickname() {
        const nickname = document.querySelector("#new-nickname").value;
        const errorDisplay = document.querySelector("#p-nick-error");
        if (!nickname) {
            errorDisplay.innerHTML = "";
            return false;
        }
        const response = await api.validCheck("nickname", nickname);
        if (response.status !== 200) {
            errorDisplay.innerHTML = "이미 사용 중인 닉네임입니다.";
            return false;
        } else {
            errorDisplay.innerHTML = "사용 가능한 닉네임입니다.";
            return true;
        }
    }
    
    async function validcheckEmail() {
        const email = document.querySelector("#new-mail").value;
        const errorDisplay = document.querySelector("#p-mail-error");
        if (!email) {
            errorDisplay.innerHTML = "";
            return false;
        }
        const response = await api.validCheck("email", email);
        // 이메일 유효성 검사 로직 추가 가능
        if (response.status !== 200) {
            errorDisplay.innerHTML = "이미 사용 중인 이메일입니다.";
            return false;
        } else {
            errorDisplay.innerHTML = "사용 가능한 이메일입니다.";
            return true;
        }    
    }
    
    function setVerifyTimer() {
        time = 600;
        var curMin = document.querySelector("#remain_min");
        var curSec = document.querySelector("#remain_sec");
        var checkBtn = document.querySelector("#check")
        const errorDisplay = document.querySelector("#p-verify-error");
        const timerInterval = setInterval(function () {
            if (time > 0) {
                time = time - 1;
                let min = Math.floor(time / 60);
                let sec = String(time % 60).padStart(2, "0");
                curMin.innerHTML = min;
                curSec.innerHTML = sec;
            } else {
                clearInterval(timerInterval);
                checkBtn.disabled = true;
                errorDisplay.innerHTML = "10분이 경과했어요. 인증번호를 다시 받아주세요."
            }
        }, 1000);
    }
    
    async function verifyEmail() {
        const email = document.querySelector("#new-mail").value;
        const errorDisplay = document.querySelector("#p-verify-error");
        if (!email) {
            errorDisplay.innerHTML = "";
            return false;
        }
        console.log("VERIFY EMAIL!")
        const response = await api.sendEmailVerifyPin(email);
        if (response.status != 200) {
            errorDisplay.innerHTML = "인증 코드를 보내는데 실패했어요."
        } else {
            errorDisplay.innerHTML = "인증 코드가 전송되었어요."
            setVerifyTimer();
        }
    }
    
    async function checkEmailPin() {
        const email = document.querySelector("#new-mail").value
        const verifyPin = document.querySelector("#verfiyPin").value
        const errorDisplay = document.querySelector("#p-check-error");
        const checkBtn = document.querySelector("#check");
        if (!verifyPin) {
            errorDisplay.innerHTML = ""
            return ;
        }
        console.log("CHECK PIN!!")
        const response = await api.checkEmailVerifyPin(email, verifyPin);
        if (response.status != 200) {
            errorDisplay.innerHTML = "인증번호 대조에 실패했어요..."
        } else {
            checkBtn.disabled = true; // 버튼 비활성화
            checkBtn.classList.add("disabled"); // 비활성화 스타일 추가
            CorrectPin = true;
            errorDisplay.innerHTML = "인증번호가 일치해요!"
        }
        console.log(response);
    }
    
    function checkPassword(password) {
        let strength = 0;
        if (password.length >= 4) strength += 1;    // 길이 체크
        if (/[a-z]/.test(password)) strength += 1;  // 소문자 체크
        if (/[0-9]/.test(password)) strength += 1;  // 숫자 체크
        return strength;
    }
    
    const handlePasswordInput = () => {
        const password = document.querySelector("#new-password").value;
        const strength = checkPassword(password);
        const strengthDisplay = document.querySelector("#p-pass-strength");
        const confirmPassword = document.querySelector("#confirm-password").value;
        const errorDisplay = document.querySelector("#p-pass-error");
        let strengthText = "";
        
        if (!password) {
            strengthText = "";
            strengthDisplay.innerHTML = strengthText;
            return false;
        } else if (strength != 3){
            strengthText = "비밀번호는 4자리 이상, 영어 소문자와 숫자를 포함해야 합니다.";
            strengthDisplay.innerHTML = strengthText;
            return false;
        } else {
            strengthText = "OK";
        }

        if (password !== confirmPassword) {
            if (confirmPassword) {
                errorDisplay.innerHTML = "비밀번호와 확인 비밀번호가 일치하지 않습니다."
                Confirm = false;
            }       
        }
        else if (password === confirmPassword) {
            errorDisplay.innerHTML = "비밀번호와 확인 비밀번호가 일치합니다.";
            Confirm = true;
        }
    
        strengthDisplay.innerHTML = strengthText;
        return true;
    }

    async function validcheckPassword() {
        const password = document.querySelector('#new-password').value;
        const confirmPassword = document.querySelector("#confirm-password").value;
        const errorDisplay = document.querySelector("#p-pass-error");
        console.log(confirmPassword);
        if (!confirmPassword) {
            errorDisplay.innerHTML = "";
            Confirm = false;
        }
        else if (password !== confirmPassword) {
            errorDisplay.innerHTML = "비밀번호와 확인 비밀번호가 일치하지 않습니다."
            Confirm = false;
        }
        else if (password === confirmPassword) {
            errorDisplay.innerHTML = "비밀번호와 확인 비밀번호가 일치합니다.";
            Confirm = true;
        }
    }
    
    return (
        <div id="signup-container">
            <div id="welcome">MAPLEPONG</div>
            <div className="inputBox">
                <input id="new-username" placeholder="아이디" onBlur={validcheckUsername}></input>
                <p id="p-id-error" className="errMessage"></p>
            </div>
            <div className="inputBox">
                <input id="new-password" type="password" placeholder="비밀번호" onBlur={handlePasswordInput}></input>
                <p id="p-pass-strength"></p>
            </div>
            <div className="inputBox">
                <input id="confirm-password" type="password" placeholder="비밀번호 확인" onBlur={validcheckPassword}></input>
                <p id="p-pass-error" className="errMessage"></p>
            </div>
            <div className="inputBox">
                <input id="new-nickname" placeholder="닉네임" onBlur={validcheckNickname}></input>
                <p id="p-nick-error" className="errMessage"></p>
            </div>
            <div id="mailBox">
                <input id="new-mail" type="email" placeholder="이메일" onBlur={validcheckEmail}></input>
                <button id="verify" onclick={verifyEmail}>인증</button>
                <p id="p-mail-error" className="errMessage"></p>
            </div>
            <div>
                <p id="p-verify-error" className="errMessage"></p>
                <p id="p-timer" className="errMessage"></p>
            </div>
            <div id="mailBox">
                <input id="verfiyPin" type="email" placeholder="인증번호를 입력해주세요"></input>
                <button id="check" onclick={checkEmailPin}>확인</button>
                <p id="p-check-error" className="errMessage"></p>
            </div>
            <div>
                <span id="remain_min">10</span>:
                <span id="remain_sec">00</span>
            </div>
            <div id="interact">
                <button class="btns" onClick={getInfo}>회원가입</button>
                <Link to="">
                    <button class="btns">홈으로</button>
                </Link>
            </div>
        </div>
    );
}

export default SignUp;