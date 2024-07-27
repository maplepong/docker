/* @jsx myReact.createElement */
import myReact, { useState, useRef } from "../core/myReact.js";

function TestRef() {
	//useRef Test
	const ref = useRef(0);
	function handleClick() {
		ref.current = ref.current + 1;
		alert('You clicked ' + ref.current + ' times!');
		}
	

	const [state, setState] = useState(0);

	const [global, setGlobal] = myReact.useGlobalState("test", 0);
	
	function handleGlobal () {
		setGlobal(global + 1);
	}
	
	return  (
		<div>
		<p>Rendered {state} times</p>
		<button onclick={() => setState(state + 1)}>render</button>
		<button onClick={handleClick}> 
			Click me!
		</button>
		<p>useref {ref.current} times</p>
		<button onClick={handleGlobal}> 
			global!
		</button>
		<p>global {global} times</p>
		</div>
	)
}

export default TestRef;
	
