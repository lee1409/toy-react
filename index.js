let React = {
  createElement(type, attribute, ...children) {
    let el = document.createElement(type)

    for (const key in attribute) {
      el.setAttribute(key, attribute[key])
    }

    for (let child of children) {
      if (typeof child === 'string') {
        child = document.createTextNode(child)
      }
      el.appendChild(child)
    }

    return el
  }
}

let ReactDOM = {
  render(element, container) {
    container.appendChild(element)
  }
}

ReactDOM.render(<div><div>Hello</div></div>, document.body)
