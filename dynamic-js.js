var React = {
    watcher: null,
    createElement: function (type, props, ...children) {
        var elt;
        if (type instanceof Function) {
            elt = type(props, ...children);
            return elt;
        }
        else {
            elt = document.createElement(type || "template")
            if (props) {
                Object.keys(props).forEach(key => {
                    try {
                        if (key === "className") {
                            elt.setAttribute("class", props[key]);
                        } else if (key === "style") {
                            Object.keys(props[key]).forEach(styleKey => {
                                elt.style[styleKey] = props[key][styleKey];
                            });
                        } else if (key === "onClick") {
                            elt.addEventListener("click", props[key]);
                        } else {
                            elt.setAttribute(key, props[key]);
                        }
                    } catch (error) {
                        console.error(error);
                    }
                });
            }
        }

        children.forEach(child => {
            var childElt = (Array.isArray(child)) ? child.map(React.toElt) : React.toElt(child);
            if (Array.isArray(child)) {
                elt.append(...child);
            } else if (childElt.tagName === 'TEMPLATE') {
                elt.append(...childElt.children);
            } else elt.append(childElt);
        });
        return elt;
    },

    toElt(child) {
        switch (typeof child) {
            case "function":
                let result = watch(child);
                return React.toElt(result);
            case "string":
            case "boolean":
            case "number":
                return document.createTextNode(child);
            default:
                if (child instanceof Node) return child;
                else if (Array.isArray(child)) {
                    let result = document.createElement("template");
                    result.append(...child.map(React.toElt));
                    return result
                }
                else if (child instanceof Calculated) {
                    var calculated = child;
                    var startElt = document.createComment("dyn" + calculated.id);
                    var currentElts = [];
                    var replaceDOM = () => {
                        currentElts = React.replaceDOM(startElt, calculated._getValue(), currentElts)
                    };
                    calculated._addListener(replaceDOM);
                    setTimeout(replaceDOM);
                    return startElt;
                }
                else {
                    return document.createTextNode(JSON.stringify(child));
                }
        }

    },

    replaceDOM(startElt, dynamicResult, currentElts) {
        currentElts?.forEach(e => e.remove());
        var newElt = React.toElt(dynamicResult);
        var newElts = newElt.tagName === 'TEMPLATE' ? Array.from(newElt.children) : [newElt];
        var insertionPoint = startElt.nextSibling;
        var parentElt = startElt.parentElement;
        newElts.forEach(e => {
            if (insertionPoint) {
                parentElt.insertBefore(e, insertionPoint)
                insertionPoint = e.nextSibling;
            }
            else parentElt.append(e);
        });
        return newElts;
    }

}

function render(renderFunctionOrResult, container) {
    try {
        var dynamicResult = React.toElt(renderFunctionOrResult)
        var newElt = React.toElt(dynamicResult);
        var newElts = newElt.tagName === 'TEMPLATE' ? Array.from(newElt.children) : [newElt];
        container.replaceChildren(...newElts);
    } catch (error) {
        console.error(error);
        container.replaceChildren(React.createElement("pre", null, error.toString()));
    }
}

function ref(value) {
    if (value instanceof Ref) return value;
    else return new Ref(value);
}

class HasValue {
    #listeners = [];
    #value;

    constructor(value) {
        this.#value = value;
    }

    _addListener(listener) {
        this.#listeners.push(listener);
    }

    _removeListener(listener) {
        this.#listeners = this.#listeners.filter(l => l !== listener);
    }

    _onValueChanged() {
        this.#listeners.forEach(listener => {
            listener(this.#value);
        });
    }

    _getValue() {
        return this.#value;
    }

    _setValue(newValue) {
        if (newValue !== this.#value) {
            this.#value = newValue;
            this._onValueChanged();
        }
    }
}

class Ref extends HasValue {
    get value() {
        React.watcher?.onGettingRefValue(this);
        return this._getValue();
    }

    set value(newValue) {
        this._setValue(newValue);
    }

}

class Calculated extends HasValue {
    id;
    static #idCounter = 0;

    constructor(value) {
        super(value);
        this.id = ++(Calculated.#idCounter);
        console.log("calc#" + this.id + ": " + value);
    }

}

function watch(fn) {
    var previousWatcher = React.watcher;
    try {
        var watchedRefs = new Set();
        React.watcher = {
            onGettingRefValue: (ref) => watchedRefs.add(ref)
        }
        var functionResult = fn();
        var dirty = false;
        if (watchedRefs.size) {
            functionResult = new Calculated(functionResult);
            watchedRefs.forEach(ref => {
                ref._addListener(() => {
                    if (!dirty) {
                        dirty = true;
                        setTimeout(() => {
                            try {
                                functionResult._setValue(fn());
                            } finally {
                                dirty = false;
                            }
                        });
                    }
                });
            });
        }
        return functionResult;
    } finally {
        React.watcher = previousWatcher;
    }
}