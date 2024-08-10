import fiberNode from "./fiberNode";
import {makeProps} from "./utils"

function disassembleChildren(children, result){
	result = result || [];
	if (!Array.isArray(children)){
		result.push(children);
		return result;
	}
	children.forEach((child) => {
		if (Array.isArray(child)){
			result = disassembleChildren(child, result);
		}
		else if (child == undefined || child == null || child == ""){
			// console.error("child is undefined:: check is needed")
			// result.push("no value"); //수정 및 확인 필요
		}
		else {
			result.push(child);
		}
	})
	return result;
}

export default function createElement(tag, props, ...children){
	const fiber = new fiberNode();
	var instance;
	props = props || {};
	children = children || [];
	if (!window.currentFiberNode){ //not rendering, just Saving
		if (typeof tag === 'function') {
			fiber.instance = tag;
			if (children.length > 0){
				props = makeProps(props, children)
			}
			// instance = (tag(props));
		}
		else{
			instance = {tag, props, children};
			fiber.tag = instance.tag;
			fiber.props = instance.props;
			fiber.children = instance.children;
		}
		return fiber;
	}
	else {
		window.currentFiberNode = fiber;
		if (typeof tag === 'function'){
			fiber.instance = tag;
			if (children.length > 0){
				props = makeProps(props, children)
			}
			instance = (tag(props));
		}
		else{
			instance = {tag, props, children};
		}
		fiber.tag = instance.tag;
		fiber.props = instance.props;
		fiber.children = disassembleChildren(instance.children); 
		// dissassemble array child in createElement level
		// before: in ReactDOM
	}
	return fiber;
}