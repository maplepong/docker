import fiberNode from "./fiberNode.js";
import myReactDOM from "./myReactDOM.js";
import createElement from "./createElement.js";
import { exist, isEqualObj } from "./utils.js"
import router from "./Router.js";

export function Link(props){
	// //console.log(props)
	const tag = "a"
	const href = props["to"];
	if (exist(href))
		delete props["to"];
	else {
		console.error("Link but no path provided");
	}
	props["href"] = href;
	if (exist(props.children)){
		var children = props["children"];
		if (Array.isArray(children) === false)
			children = [props["children"]];
		delete props["children"]
		return {tag, props, children};
	}
	return {tag, props};
}

function createMyReact() {
	return {
	enrenderComponent : [],
	enrenderQueue : [], //what is changed {changedhow, component, props}
	callback : [], // will be called after reRender
	fiberRoot : null,  //root of fiberNode
	currentFiberNode : null,
	isUpdateScheduled : false,

	// renderFiberRoot : function () {
	// // createElement하는 시점, 특히 라우터에서 import되는 타이밍에 렌더하지 않게 방지
	// //
	// const fiber = new fiberNode(); 
	// window.currentFiberNode = fiber; //tracking which Fiber is on rendering 
	

	// },
	render : async function render(newVirtualDOM, eventType){
		console.log("??", this.callback);
		if (eventType === "reRender" || eventType === "batchRender")
		{//변화하는 경우 : 이게 enrenderQueue에 들어가있을때밖에 없나???
			//re-render....
			//is it reRender or 
			const newFiberRoot = this.reRender(this.fiberRoot);
			// this.diffRoot(this.FiberRoot); //enrenderQueue를 통해 바뀐 부분 찾기
			// await myReactDOM.updateDOM(this.enrenderQueue); //나중에 바뀐 부분만 보낼 수 있게...업데이트 할 수 있으면...좋고...
			await myReactDOM.updateDOM(newFiberRoot);
			this.fiberRoot = newFiberRoot;
			this.enrenderQueue = [];
			this.isUpdateScheduled = false;
		}
		else if (eventType === "newPage"){
			this.erase(); ///처음 등록한 콜백 지워짐
			myReactDOM.erase();
		}
		if (!this.fiberRoot) { //first Render, called by DOM
			this.fiberRoot = newVirtualDOM;
			this.fiberRoot.render();
			await myReactDOM.initDOM(this.fiberRoot);
		}
		// 1. call callback
		// 2. if cleanup exist -> save it to the useState. it will be used in unmount
		// 3. empty the callback arr
		// f ->  {callback, fiber.willUnmount} 
		this.callback.forEach((f) => {
			f.willUnmount.forEach((cleanup) => cleanup());
			f.willUnmount = [];
			// console.log(f);
			const cleanup = f.callback();
			cleanup ? f.willUnmount.push(cleanup) : null });
		console.log("Render finished, callback arr is ", this.callback)
		this.callback = [];
	},

	erase : function erase() {
		this.fiberRoot = null;
		this.enrenderComponent = []
		this.enrenderQueue = []
		this.callback.forEach((f) => {
			f.willUnmount.forEach((cleanup) => cleanup());
		})
		this.callback = []
	},
	
	createElement : createElement,

	reRender : function (oldfiber) {
		const fiber = new fiberNode(oldfiber);
		//new fiber state value update && copy values of old fiber
		//if fiber changed? call instance
		if (fiber.changedState && fiber.changedState.length){
			//console.log("changedState", fiber.changedState)
			fiber.changedState.forEach(d => {
				//console.log(d)
				fiber.state[d.i] = d.value;
				console.log("fiber updated state" , fiber.state);
			})
			fiber.changedState = [];
			fiber.changed = false;
			window.currentFiberNode = fiber;
			const instance = fiber.instance(fiber.props); //함수형 컴포넌트 실행
			fiber.tag = instance.tag;
			fiber.props = instance.props;
			fiber.children = instance.children;
			window.currentFiberNode = null;
		}
		else {

			if (oldfiber.children && Array.isArray(oldfiber.children)) {
				oldfiber.children.forEach((child) => {
					if (typeof child === "number" || typeof child === "string"){
						fiber.children.push(child);
					}
					else {
						fiber.children.push(this.reRender(child));
					}
				})
			}
		}
		//console.log(fiber);
		return fiber;
	},

	/* 현재의 fiberRoot, newFiberRoot 비교해서
	만약 바뀐 부분 있으면 enrenderQueue에 추가
	전부 비교한 후 Root 대체

	*/
	diffRoot : function (newFiberRoot) {
		this.fiberRoot = newFiberRoot;
	},
	redirect: function (param) {
		if (!param){
			console.error("redirect err: no path");
			return
		}
        else if (param === "/") {
            param = "";
        }
		console.log("redirect call")
		var path;
		if (param !== "/")
			path = "/" + param;
		else
			path = "/";
		console.log(path);
		history.pushState({}, "", path);
		router();
	}
	}
}

const myReact = createMyReact();
export default myReact; 

function batchUpdates(fiber) {
	myReact.enrenderQueue.push(fiber);
	if (!myReact.isUpdateScheduled) {
		myReact.isUpdateScheduled = true;
		requestAnimationFrame(() => {
			myReact.render(null, "batchRender");
		})
	}
}

export function useState(initValue){
	const fiber = window.currentFiberNode;
	const i = fiber.statePosition++;
	fiber.state[i] = fiber.state[i] || initValue;
	
	const setState = (value) => {
		if (fiber.state[i] === value) return 
		//console.log("setState err-value same-",value);
		fiber.changedState.push({i, value});
		// myReact.enrenderQueue.append(["stateChange", fiber, i]);
		fiber.changed = true;
		batchUpdates(fiber);
		// scheduleUpdate(fiber);
		// console.log("렌더를 합니다")
		// myReact.render(null, "reRender");
		//render, how I can get the infomation of current page?
	}
	return [fiber.state[i], (v) => setState(v)];
}

function scheduleUpdate(fiber) {
	// myReact.enrenderQueue.push(fiber);
	// if (!myReact.isUpdateScheduled){
	// 	myReact.isUpdateScheduled = true;
	// 	setTimeout(() => {myReact.render(null, "reRender")}, 20);
	// }
	batchUpdates(fiber);
}

/*
	callback -> return f is cleanup function, use carefully
	cleanup calls when :
	1. idk..... will update this later
*/
export function useEffect(callback, deps){
	console.log("useEffect called: callback", callback)
	console.log("useEffect called: deps", deps)
	const fiber = window.currentFiberNode;
	const i = fiber.effectPosition;
	fiber.effectPosition++;
	//check if fiber has this callback as use
	fiber.useEffect[i] = fiber.useEffect[i] ||{ callback, deps: undefined, cleanup: null};
	 //first call of this useState
	// //if cleanup exist -> runs at
	// // 1. before reRender 
	// // 2. before unMount this component
	// if (fiber.useEffect[i].cleanup) {
	// 	fiber.useEffect[i].cleanup();
	// } // cleanup -> calls on myReact.render

	/* 	
	
	check if callback need to queue
	1. no deps -> call for one time, erase useEffect
	2. dep || func change -> enqueue callback,
	if return(cleanup) exist, add to fiber obj...
	
	after calling callback, if cleanUp exist,
	save cleanUp as a 3rd value.
	
	*/
	// if (fiber.useEffect[i])
	// 	console.log("useEffect deps old", fiber.useEffect[i].deps)
	// console.log("useEffect deps new", deps)
	// console.log("isEqual", isEqualObj(fiber.useEffect[i].deps, deps), fiber.useEffect[i].deps, deps);
	if (deps !== undefined && isEqualObj(fiber.useEffect[i].deps, deps)) {
		console.log("!!!!!!!!!!!!!!----------------------snocallback")
		return;
	}
	//if deps not changed || include both are empth array [], just return

	// calling callback :s
	// 1. deps === undefined
	// 2. deps === [] (but first call)
	// 3. deps changed
	myReact.callback.push({callback, willUnmount: fiber.willUnmount});
	fiber.useEffect[i].deps = deps;
}

export function useRef(newRef){
	const fiber = window.currentFiberNode;
	const i = fiber.refPosition;
	fiber.refPosition++;
	fiber.ref[i]  = fiber.ref[i] || {current : newRef};
	return fiber.ref[i];
}

// export function 