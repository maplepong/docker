/* @jsx myReact.createElement */
//// TEST PAGE for useState, useEffect
import myReact, { useState, useEffect, Link } from "../core/myReact.js";

const Test = () => {

	//test: count state
    const [count, setCount] = useState(0);
	const incre = () => {
		setCount(count + 1);
	}
	const decre = () => {
		setCount(count - 1);
	}
	const callbackTest = () => {
		console.log("callback : callllllllbackkkkkkk");
	}
	useEffect(callbackTest, [count]); //count 변수 변경시 실행

	//test: text state
	const [text, setText] = useState("test");
	useEffect(function testDep() {
		console.log("callback : test Dependencies")
	}, [])
	const callback = () => {
		console.log("callback : text change")
	}
	useEffect (callback, [text]); // 텍스트 변수 변경시 실행
	const textchange = () => {
		setText(document.querySelector("#textInput").value)
	}
	
	//redirect example
	const re = () => { myReact.redirect("welcome");}


	//onClick말고다른거Test
	const onOtherTest = () => { console.log("onchange success")}

	return <div class="test">
			<div>
				<p>Test state-count: {count}
				</p>
				<button onclick={incre}>증가</button>
				<button onclick={decre}>감소</button>
			</div>
			<div>
				<p >Test state-text : {text}</p>
				<input id="textInput"></input>
				<button onclick={textchange}></button>
			</div>
			<div>
				<p>Test onchange : </p>
				<select onchange={onOtherTest}>
					<option value="ok">ok</option>
					<option value="no">no</option>
					</select>
			</div>
			<button onClick={re}>Test redirect</button>
	    </div>
}

export default Test;