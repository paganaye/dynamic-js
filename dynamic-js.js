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

        var toElt = (child) => {
            if (child instanceof Node) return child;
            else if (Array.isArray(child)) {
                var result = document.createElement("template");
                result.append(...child.map(toElt));
                return result
            }
            else {
                switch (typeof child) {
                    case "string":
                    case "boolean":
                    case "number":
                        return document.createTextNode(child);
                    default:
                        if (child instanceof DynamicValue) {
                            var dynValue = child;
                            var startElt = document.createComment("Dyn" + dynValue.getId());
                            var currentElts = [];
                            var refreshDom = () => {
                                if (startElt.parentElement === null) setTimeout(refreshDom, 1)
                                var dynamicResult = dynValue._getValue();
                                var newElt = toElt(dynamicResult);
                                var newElts = newElt.tagName === 'TEMPLATE' ? Array.from(newElt.children) : [newElt];
                                currentElts?.forEach(e => e.remove());
                                var insertionPoint = startElt.nextSibling;
                                var parentElt = startElt.parentElement;
                                newElts.forEach(e => {
                                    if (insertionPoint) {
                                        parentElt.insertBefore(e, insertionPoint)
                                        insertionPoint = e.nextSibling;
                                    }
                                    else parentElt.append(e);
                                });
                                currentElts = newElts;
                            };
                            dynValue._addListener(() => refreshDom());
                            setTimeout(refreshDom);
                            return startElt;
                        }
                        else {
                            return document.createTextNode(JSON.stringify(child));
                        }
                }
            }
        };

        children.forEach(child => {
            var childElt = (Array.isArray(child)) ? child.map(toElt) : toElt(child);
            if (Array.isArray(child)) {
                elt.append(...child);
            } else if (childElt.tagName === 'TEMPLATE') {
                elt.append(...childElt.children);
            } else elt.append(childElt);
        });
        return elt;
    }
}

function render(renderFunctionOrResult, container) {
    try {
        if (typeof renderFunctionOrResult === 'function') renderFunctionOrResult = renderFunctionOrResult();
        if (renderFunctionOrResult.tagName === 'TEMPLATE') container.replaceChildren(...renderFunctionOrResult.children);
        else container.replaceChildren(renderFunctionOrResult);
    } catch (error) {
        console.error(error);
        container.replaceChildren(React.createElement("pre", null, error.toString()));
    }
}

function ref(value) {
    return new Ref(value);
}

class DynamicValue {
    #listeners = [];
    #value;
    #id;
    static #dynCounter = 0;

    constructor(value) {
        this.#value = value;
        this.#id = ++(DynamicValue.#dynCounter);
    }

    getId() {
        return this.#id;
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

class Ref extends DynamicValue {
    get value() {
        React.watcher?.onGettingRefValue(this);
        return this._getValue();
    }

    set value(newValue) {
        this._setValue(newValue);
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
            functionResult = new DynamicValue(functionResult);
            watchedRefs.forEach(ref => {
                ref._addListener(() => {
                    if (!dirty) {
                        dirty = true;
                        setTimeout(() => {
                            functionResult._setValue(fn());
                            dirty = false;
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