class ElementWrapper {
  constructor(type) {
    this._root = document.createElement(type);
  }

  setAttribute(key, value) {
    this._root.setAttribute(key, value);
  }

  appendChild(child) {
    this._root.appendChild(child.root);
  }
  get root () {
    return this._root
  }
}

class TextWrapper {
  constructor(text) {
    this._root = document.createTextNode(text)
  }
  get root () {
    return this._root
  }
}

React.Component = class {
  constructor() {
    this.children = [];
    this.props = {};
    this._root = null;
  }

  setAttribute(key, value) {
    this.props[key] = value;
  }

  appendChild(child) {
    this.children.push(child)
  }

  get root () {
    if (!this._root) this._root = this.render().root;
    return this._root
  }
}

export const React = {
  createElement(type, attribute, ...children) {
    let el = typeof type !== "string" ? new type : new ElementWrapper(type);

    // 2nd step we need to set attribute
    for (const key in attribute) {
      el.setAttribute(key, attribute[key]);
    }

    // Append child to the element
    let insertChildren = (children) => {
      for (let child of children) {
        if (typeof child === "string") {
          child = new TextWrapper(child)
        }
        if (Array.isArray(child)) {
          insertChildren(child)
        } else {
          el.appendChild(child)
        }
      }
    }

    insertChildren(children)

    return el;
  },
};

export const ReactDOM = {
  render(component, container) {
    // React.createElement()
    container.appendChild(component.root);
  },
};
