const RENDER_TO_DOM = Symbol("render to dom");

class ElementWrapper {
  constructor(type) {
    this._root = document.createElement(type);
  }

  setAttribute(key, value) {
    if (key.match(/^on([\s\S]+)$/)) {
      this._root.addEventListener(
        RegExp.$1.replace(/^[\s\S]/, (c) => c.toLowerCase()),
        value
      );
    } else {
      if (key === "className") {
        this._root.setAttribute("class", value);
      } else {
        this._root.setAttribute(key, value);
      }
    }
  }

  appendChild(component) {
    let range = document.createRange();
    range.setStart(this._root, this._root.childNodes.length);
    range.setEnd(this._root, this._root.childNodes.length);
    component[RENDER_TO_DOM](range);
  }
  [RENDER_TO_DOM](range) {
    range.deleteContents();
    range.insertNode(this._root);
  }
}

class TextWrapper {
  constructor(text) {
    this._root = document.createTextNode(text);
  }
  [RENDER_TO_DOM](range) {
    range.deleteContents();
    range.insertNode(this._root);
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
};

React.Component = class {
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

  [RENDER_TO_DOM](range) {
    this._range = range;
    this.render()[RENDER_TO_DOM](range);
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
      this.rerender();
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
    this.rerender();
  }
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
