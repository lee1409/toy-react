const RENDER_TO_DOM = Symbol("render to dom");

class Component {
  constructor() {
    this.children = [];
    this.props = Object.create(null);
    this._root = null;
    this._range = null;
  }

  setAttribute(key, value) {
    this.props[key] = value;
  }

  appendChild(child) {
    this.children.push(child);
  }

  get vdom() {
    return this.render().vdom;
  }

  [RENDER_TO_DOM](range) {
    this._range = range;
    this._vdom = this.vdom;
    this._vdom[RENDER_TO_DOM](range);
  }

  update() {
    let isSameNode = (oldNode, newNode) => {
      if (oldNode.type !== newNode.type) return false;
      for (let name in newNode.props) {
        if (newNode[name] !== oldNode.props[name]) {
          return false;
        }
      }
      if (Object.keys(oldNode.props).length > Object.keys(newNode.props).length)
        return false;
      if (newNode.type === "#text") {
        if (newNode.content !== oldNode.content) return false;
      }
      return true;
    };

    let update = (oldNode, newNode) => {
      if (!isSameNode(oldNode, newNode)) {
        newNode[RENDER_TO_DOM](oldNode._range);
        return;
      }
      newNode._range = oldNode._range;

      let newChildren = newNode.vchildren;
      let oldChildren = oldNode.vchildren;

      if (!newChildren || !newChildren.length) {
        return;
      }

      // Get old children
      let tailRange = oldChildren[oldChildren.length - 1]._range;

      for (let i = 0; i < newChildren.length; i++) {
        let newChild = newChildren[i];
        let oldChild = oldChild[i];
        if (i < oldChild.length) {
          update(oldChild, newChild);
        } else {
          // Get the range and add newChildren
          let range = document.createRange();
          range.setStart(tailRange.endContainer, tailRange.endOffset);
          range.setEnd(tailRange.endContainer, tailRange.endOffset);
          newChild[RENDER_TO_DOM](range);
          tailRange = range;
        }
      }
    };
    let vdom = this.vdom;
    update(this._vdom, vdom);
    this._vdom = vdom;
  }

  rerender() {
    let old = this._range;
    // Insert the range
    let range = document.createRange();
    range.setStart(old.startContainer, old.startOffset);
    range.setEnd(old.startContainer, old.startOffset);

    this[RENDER_TO_DOM](range);

    old.setStart(range.endContainer, range.endOffset);
    old.deleteContents();
  }

  // Update state
  // Rerender the component
  setState(newState) {
    if (this.state === null || typeof this.state === "undefined") {
      this.state = newState;
      this.update();
      return;
    }

    // Merge from new state to or state
    let merge = (prevState, newState) => {
      for (const key in newState) {
        if (prevState[key] == null || prevState[key] !== "object") {
          prevState[key] = newState[key];
        } else {
          merge(prevState[key], newState[key]);
        }
      }
    };

    merge(this.state, newState);
    this.update();
  }
}

function replaceContent(range, node) {
  range.insertNode(node);
  range.setStartAfter(node);
  range.deleteContents();

  range.setStartBefore(node);
  range.setEndAfter(node);
}

export class TextWrapper extends Component {
  constructor(text) {
    super(text);
    this.stype = "#text";
    this.content = text;
  }

  get vdom() {
    return this;
  }
  [RENDER_TO_DOM](range) {
    this._range = range;
    let root = document.createTextNode(this.content);
    replaceContent(range, root);
  }
}

export class ElementWrapper extends Component {
  constructor(type) {
    super(type);
    this.type = type;
  }

  get vdom() {
    this.vchildren = this.children.map((child) => child.vdom);
    return this;
  }

  [RENDER_TO_DOM](range) {
    this._range = range;

    let root = document.createElement(this.type);
    for (let key in this.props) {
      const value = this.props[key];
      if (key.match(/^on([\s\S]+)$/)) {
        root.addEventListener(
          RegExp.$1.replace(/^[\s\S]/, (c) => c.toLowerCase()),
          value
        );
      } else {
        if (key === "className") {
          root.setAttribute("class", value);
        } else {
          root.setAttribute(key, value);
        }
      }
    }

    if (!this.vchildren)
      this.vchildren = this.children.map((child) => child.vdom);

    for (let child of this.vchildren) {
      let childRange = document.createRange();
      childRange.setStart(root, root.childNodes.length);
      childRange.setEnd(root, root.childNodes.length);
      child[RENDER_TO_DOM](childRange);
    }
    replaceContent(range, root);
  }
}

export const React = {
  createElement(type, attribute, ...children) {
    let el = typeof type !== "string" ? new type() : new ElementWrapper(type);

    // 2nd step we need to set attribute
    for (const key in attribute) {
      el.setAttribute(key, attribute[key]);
    }

    // Append child to the element
    let insertChildren = (children) => {
      for (let child of children) {
        if (typeof child === "string") {
          child = new TextWrapper(child);
        }
        if (child === null) continue;
        if (Array.isArray(child)) {
          insertChildren(child);
        } else {
          el.appendChild(child);
        }
      }
    };

    insertChildren(children);
    return el;
  },
  Component,
};

export const ReactDOM = {
  render(component, container) {
    let range = document.createRange();
    range.setStart(container, 0);
    range.setEnd(container, container.childNodes.length);
    range.deleteContents();
    component[RENDER_TO_DOM](range);
  },
};
