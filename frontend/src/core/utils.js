export function exist(para) {
	if (typeof para === "undefined" || para === null || para === undefined){
		return false;
	}
	if (typeof para === "string" && para.isEmpty)
		return false;
	return true;
}	


//for object check is empty?
export function isEmptyObj(para){
	if (typeof para === "object" || Array.isArray(para)){
		if (para.length === 0)
			{return true;}
	}
	return false;
}

export function isEmptyArray(para){
	if (Array.isArray(para)){
		if (para.length === 0) {
			return true;
		}
	}
	return false;
}

//equal test for array 
export function isEqualObj (a, b) {
	return (JSON.stringify(a) === JSON.stringify(b));
}

export function makeProps(props, children){
	return {
		...props,
		children: children.length === 1 ? children[0] : children
	}
}

export function isObjNode(node){
	if (typeof node === "string" || typeof node === "number"){
		return false;
	}
	else 
		return true;
}