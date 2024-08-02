import myReact from "./myReact.js";
import router from "./Router.js";
import { exist, isEmptyObj, isObjNode } from "./utils.js";

const eventType = [
  "onclick",
  "onkeydown",
  "onkeyup",
  "oninput",
  "onfocus",
  "onblur",
  "onchange",
  "onmouseover",
  "onmouseout",
  "onsubmit",
];

function addEvent(target, eventType, selector, callback) {
  const children = [...document.querySelectorAll(selector)];
  children.forEach((child) => {
    child.addEventListener(eventType, (event) => {
      event.preventDefault();
      if (selector && !event.target.closest(selector)) return false;
      callback(event);
    });
  });
}

function createDOM(fNode) {
  if (typeof fNode === "string" || typeof fNode === "number" || typeof fNode === "boolean") {
    const node = document.createTextNode(fNode);
    return node;
  }
  const node = document.createElement(fNode.tag);
  fNode.stateNode = node;
  updateProps(node, fNode.props || {}, null);
  updateChildren(node, fNode.children || [], null);
  return node;
}

function updateProps(target, newProps, oldProps) {
  if (oldProps) {
    for (const [key, value] of Object.entries(oldProps)) {
      if (oldProps[key] === newProps[key]) continue;
      else target.removeAttribute(key);
    }
  }
  for (const [key, value] of Object.entries(newProps)) {
    if (eventType.find((e) => e === key.toLowerCase())) {
      target[key.toLowerCase()] = value;
    } else if (oldProps && oldProps[key] === newProps[key]) continue;
    else target.setAttribute(key, value);
  }
}

function addChild(target, child) {
  if (typeof child === "number") child = child.toString();
  if (typeof child === "string") {
    child = document.createTextNode(child);
    target.appendChild(child);
  } else target.appendChild(createDOM(child));
}

function updateChildren(target, newChildren, oldChildren) {
  if (oldChildren) {
    const maxLength = Math.max(newChildren.length, oldChildren.length);
    // for (let i = maxLength - 1; i >= 0; i--){
    for (let i = 0; i < maxLength; i++) {
      // 	let newChild = newChildren[i];
      // 	if (typeof newChild === "string" ||
      // 		typeof newChild === "number" ){
      // 			target.replaceChild(
      // 				document.createTextNode(newChildren[i]),
      // 				target.childNodes[i]);
      // 			return ;
      // 		}
      // if (oldChildren[i] === undefined){ //일단 undefined만 처리하게 해둠. null은 의도된 값일 수 있으니까
      // 	return addChild(target, newChildren[i]);
      // }
      diffDom(target, newChildren[i] || null , oldChildren[i] || null, i);
    }
    return;
  } else {
    //add new
    if (!newChildren || newChildren.length === 0) return;
    newChildren.forEach((child) => addChild(target, child));
  }
}

function textNodeUpdate(parent, newfNode, oldfNode, index) {
  if (typeof oldfNode === "string" || typeof oldfNode === "number") {
    if (typeof newfNode === "string" || typeof newfNode === "number") {
      //old : text | new : text
      if (oldfNode === newfNode) return; //same
      return parent.replaceChild(
        document.createTextNode(newChildren[i]),
        target.childNodes[i]
      );
    }
    if (newfNode)
      //old : text | new
      return parent.prepend(createDOM(newfNode));
  } else if (typeof newfNode === "string" || typeof newfNode === "number") {
    parent.replaceChild(
      document.createTextNode(newChildren[i]),
      target.childNodes[i]
    );
  }
}

//parent: DOM node
function diffDom(parent, newfNode, oldfNode, index) {
  var element;
  // error ::
  if (!oldfNode && !newfNode) return 0;

  // TextNode update
  if (typeof oldfNode === "string" || typeof oldfNode === "number") {
    if (typeof newfNode === "string" || typeof newfNode === "number") {
      //old : text | new : text
      if (oldfNode === newfNode) return; //same
      return parent.replaceChild(
        document.createTextNode(newfNode),
        parent.childNodes[index]
      );
    }
    if (newfNode)
      //old : text | new
      return parent.prepend(createDOM(newfNode));
  } else if (
    (oldfNode && typeof newfNode === "string") ||
    typeof newfNode === "number"
  ) {
    return parent.replaceChild(
      document.createTextNode(newfNode),
      parent.childNodes[index]
    );
  }

  // removed :: unmount
  if (oldfNode && !newfNode) {
    // Need to remove EventListner or onClick;
    if (oldfNode.isEvent) {
    }
    if (
      isObjNode(oldfNode) &&
      oldfNode.willUnmount &&
      !isEmptyObj(oldfNode.willUnmount)
    ) {
      oldfNode.willUnmount.forEach((c) => {
        c();
      });
    }
    return parent.removeChild(parent.childNodes[index]);
  }

  // created :: index++;
  else if (!oldfNode && newfNode) {
    return parent.append(createDOM(newfNode)); ///??????
  }

  // changed tag ::
  if (oldfNode.tag !== newfNode.tag) {
    parent.replaceChild(createDOM(newfNode), parent.childNodes[index]);
  }
  // same tag ::
  else {
    // if (newfNode.tag === "button") ///???? what????why????
    updateProps(
      parent.childNodes[index],
      newfNode.props || {},
      oldfNode.props || {}
    );
    updateChildren(
      parent.childNodes[index],
      newfNode.children || [],
      oldfNode.children || []
    );
  }

  return;
}

function createMyReactDOM() {
  return {
    rootNode: document.querySelector("#root"),
    DOM: null,
    fiberRoot: null,

    initDOM: function initDOM(fNode) {
      document.addEventListener("DOMContentLoaded", () => {
        window.addEventListener("routeChange", router);
        window.addEventListener("popstate", router);
      });
      if (!exist(this.rootNode)) {
        return console.error("ROOT: cannot find");
      }
      this.fiberRoot = fNode;
      this.DOM = createDOM(fNode);
      this.rootNode.appendChild(this.DOM);
      addEvent(this.rootNode, "click", "a", ({ target }) => {
        const route = target.closest("a").getAttribute("href");
        if (typeof route === "string") {
          const newPath = "/" + route;
          history.pushState({}, "", newPath);
          router();
        }
      });
    },
    updateDOM: function updateDOM(newFiberRoot) {
      diffDom(this.rootNode, newFiberRoot, this.fiberRoot, 0);
      this.fiberRoot = newFiberRoot;
    },
    erase() {
      if (this.DOM) this.rootNode.removeChild(this.DOM);
      this.DOM = null;
      myReact.erase();
    },
    reconciliate() {}, // changed 어떻게 전달할지?
  };
}

const myReactDOM = createMyReactDOM();
export default myReactDOM;
