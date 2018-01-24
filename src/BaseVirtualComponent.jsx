/*
 *  Copyright 2016 Adobe Systems Incorporated. All rights reserved.
 *  This file is licensed to you under the Apache License, Version 2.0 (the "License");
 *  you may not use this file except in compliance with the License. You may obtain a copy
 *  of the License at http://www.apache.org/licenses/LICENSE-2.0
 *
 *  Unless required by applicable law or agreed to in writing, software distributed under
 *  the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR REPRESENTATIONS
 *  OF ANY KIND, either express or implied. See the License for the specific language
 *  governing permissions and limitations under the License.
 *
 */

import { TaskQueue, Binder } from '@twist/core';
import BaseComponent from './BaseComponent';
import { _originalRender } from './BaseComponent';

let BinderRecordChange = Binder.recordChange;
let BinderRecordEvent = Binder.recordEvent;

function isNullOrWhitespace(item) {
    return !item || /^\s+$/.test(item);
}

function isNullOrNotVirtual(item) {
    return !item || !(item instanceof BaseVirtualComponent);
}

function isConcreteComponent(item) {
    return (item instanceof BaseComponent) && !(item instanceof BaseVirtualComponent);
}

function concreteItemTransform(item) {
    if (isConcreteComponent(item)) {
        BinderRecordEvent(item, 'virtual.children');
        return item[_items];
    }
    return item;
}

function flatten(arr, skipTest, itemTransform, flattenedArr) {
    for (let i = 0; i < arr.length; i++) {
        let item = itemTransform ? itemTransform(arr[i]) : arr[i];
        let shouldIgnore = skipTest(item);
        let isArray = Array.isArray(item);

        if (!flattenedArr && (shouldIgnore || isArray)) {
            // Optimisation: Only create a new array when we need to
            flattenedArr = arr.slice(0, i);
        }

        if (flattenedArr) {
            if (isArray) {
                flatten(item, skipTest, itemTransform, flattenedArr);
            }
            else if (!shouldIgnore) {
                flattenedArr.push(item);
            }
        }
    }
    return flattenedArr || arr;
}

function instantiateContent(content, context) {
    try {
        let ContentClass = content.type;
        let instance = new ContentClass(content.props, context);
        if (isConcreteComponent(instance)) {
            // You can mix real and virtual components, but the virtualRender method expects all
            // components in the tree to be able to be rendered virtually. We add the necessary methods
            // to the component instance, so that this works:
            instance[_dirty] = false;
            instance[_queuedUpdate] = false;
            instance[_items] = [];
            instance[_virtualRender] = BaseVirtualComponent.prototype[_virtualRender];
            instance.forceUpdate = BaseVirtualComponent.prototype.forceUpdate;

        }
        return instance;
    }
    catch (e) {
        // We just fall back to a plain virtual component and print an error, if we see an HTML element
        console.error(`Unexpected virtual type \`${content.type}\`. You cannot use concrete HTML tags in a virtual component - all components must themselves be virtual.`);
        return new BaseVirtualComponent({}, context);
    }
}

function propsDiffer(propsA, propsB) {
    for (let key in propsA) {
        if (propsA.hasOwnProperty(key) && propsA[key] !== propsB[key]) {
            return true;
        }
    }
    for (let key in propsB) {
        if (propsB.hasOwnProperty(key) && propsA[key] !== propsB[key]) {
            return true;
        }
    }
    return false;
}

const _dirty = Symbol('dirty');
const _queuedUpdate = Symbol('queuedUpdate');
const _items = Symbol('items');
const _virtualRender = Symbol('virtualRender');
const _linked = Symbol('linked');

class LinkedData {
    // We have to put this in an object because decorators on [] properties don't yet work (we want linked data to be a symbol)
    @Observable component;
}

/**
 * A Virtual Component is a special type of component that doesn't render anything to the DOM, but instead exposes a
 * tree of nodes in JavaScript. It still has a render function, but it's not rendered by ReactDOM.
 */
@Component
export default class BaseVirtualComponent {

    [_dirty] = false;
    [_queuedUpdate] = false;
    [_items] = [];
    [_linked] = new LinkedData;

    constructor() {
        super();

        // Prevent overriding the render() method
        if (this[_originalRender] !== BaseVirtualComponent.prototype.render) {
            throw new Error('Virtual components do not support custom render() implementations. Instead, use a normal component that renders virtual components.');
        }
    }

    /**
     * Override the React forceUpdate so we do a virtual render (this throttles the rendering to the task queue)
     * @private
     */
    forceUpdate() {
        if (this[_queuedUpdate]) {
            this[_dirty] = true;
            return;
        }

        this[_virtualRender]();
        this[_queuedUpdate] = true;

        TaskQueue.push(() => {
            if (this[_dirty] && !this.isDisposed) {
                this[_virtualRender]();
                this[_dirty] = false;
            }
            this[_queuedUpdate] = false;
        });
    }

    /**
     * Virtual rendering uses the results of render function (a JSON structure describing the child nodes), and
     * renders them virtually - this just means instantiating the virtual nodes (or updating them if props changed)
     * so we have a virtual tree. DOM nodes (like <div> etc) are not allowed in the virtual tree.
     * @private
     */
    [_virtualRender]() {
        let contents = this.render() || [];
        let items = this[_items];
        let childContext = this.getChildContext();

        if (!(contents instanceof Array)) {
            contents = [ contents ];
        }

        // Sometimes the array can contain other arrays, so we need to flatten it out
        // (this also strips out any null elements)
        contents = flatten(contents, isNullOrWhitespace);

        for (let i = 0; i < contents.length; i++) {
            let content = contents[i];
            let item = items[i];

            if (item && !(item instanceof content.type)) {
                this.unlink(item);
                item = undefined;
            }
            if (item && (propsDiffer(content.props, item.props) || propsDiffer(childContext, item.context))) {
                item.componentWillUpdate(content.props, childContext);
                item.props = content.props;
                item.context = childContext;
            }
            if (!item) {
                items[i] = this.link(instantiateContent(content, childContext));
                items[i]._parent = this;
                items[i][_virtualRender]();
            }
        }
        for (let i = contents.length; i < items.length; i++) {
            let item = items[i];
            if (item) {
                this.unlink(item);
            }
        }
        items.length = contents.length;

        BinderRecordChange(this, 'virtual.children');
        // TODO: Trigger an event so this can be extended
    }

    /**
     * Overrides the renderChildren() of BaseComponent, so it can inject the children from the
     * linked component, if it's linked!
     */
    renderChildren(name, args) {
        return this[_linked].component
            ? this[_linked].component.renderChildren(name, args)
            : super.renderChildren(name, args);
    }

    /**
     * Virtual components always just render their children (they're nodes in the virtual tree).
     * If you need custom behavior (e.g. injecting other virtual nodes), you can write a real component that
     * renders virtual components.
     *
     * If you try to override this, you'll get an error.
     */
    render() {
        return this.renderChildren() || null;
    }

    /**
     * This is the initialization code for a virtual component. Typically a virtual component exists
     * alongside a concrete component, as a mechanism for configuring that component. For example,
     * in a virtual scroller, the concrete component will render actual elements to the DOM (based on
     * what's visible), but its children will be rendered to a virtual tree for doing the layout.
     *
     * A virtual component can't be rendered by ReactDOM, so instead, you need to pass the children
     * of the concrete component to a virtual component, that will render it instead. You only need
     * to call bindToComponent on the root virtual component - this just tells the virtual component
     * to monitor the children of the given component, and render itself whenever they change.
     *
     * This method returns the virtual component, so that you can write (from a component):
     *
     * ```
     * this.virtualComponent = new MyVirtualComponent().linkToComponent(this);
     * ```
     *
     * @param {BaseComponent} component The component to bind to.
     * @returns {BaseVirtualComponent} This virtual component.
     */
    linkToComponent(component) {
        if (!(component instanceof BaseComponent)) {
            throw new Error('@VirtualComponent.linkToComponent() expects an @Component as its argument');
        }

        this[_linked].component = component;
        this.link(() => this[_linked].component = null);
        this.forceUpdate();
        return component.link(this);
    }

    /**
     * The virtual children of the virtual component.
     * @type {Array.<BaseVirtualComponent>}
     */
    get children() {
        BinderRecordEvent(this, 'virtual.children');
        return flatten(this[_items], isNullOrNotVirtual, concreteItemTransform);
    }

}
