var React = {
    watcher: null,
    createElement: function (type, props, ...children) {
        var elt;
        if (type) {
            if (type instanceof Function) {
                elt = type(props, ...children);
                return elt;
            }
            else {
                elt = document.createElement(type)
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
        }
        var toNode = (child) => {
            if (child instanceof Node) return child;
            switch (typeof child) {
                case "string":
                case "boolean":
                case "number":
                    return document.createTextNode(child);
                default:
                    if (child instanceof DynamicValue) {
                        var dynamicResult = child._getValue();
                        if (!(dynamicResult instanceof Node)) dynamicResult = document.createTextNode(dynamicResult);
                        child._addListener((newValue) => {
                            if (newValue instanceof Node) {
                                dynamicResult.replaceWith(newValue);
                                dynamicResult = newValue;
                            }
                            else dynamicResult.textContent = newValue;
                        });
                        return dynamicResult;
                    }
                    else {
                        return document.createTextNode(JSON.stringify(child));
                    }
            }
        };

        var childrenElt = [];
        children.forEach(child => {
            var childElt = (Array.isArray(child)) ? child.map(toNode) : toNode(child);
            if (Array.isArray(childElt)) childrenElt.push(...childElt);
            else childrenElt.push(childElt);
        });
        if (elt) {
            elt.append(...childrenElt);
            return elt;
        }
        return childrenElt;
    }
}

function render(renderFunction, container) {
    try {
        var renderResult = renderFunction instanceof Node || Array.isArray(renderFunction) ? renderFunction : renderFunction();
        if (Array.isArray(renderResult)) container.replaceChildren(...renderResult);
        else container.replaceChildren(renderResult);
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