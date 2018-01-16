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

import React from 'react';

import { Binder, Disposable, SignalDispatcher, Scope, TaskQueue } from '@twist/core';
import { definedAttributes, getEventHandler } from './internal/AttributeUtils';

let BinderRecordChange = Binder.recordChange;
let BinderRecordEvent = Binder.recordEvent;

let _scope = Symbol('scope');

/** private **/
export let _originalRender = Symbol('originalRender');

export default class Component extends React.PureComponent {

    constructor(props, context) {
        super(props, context);

        if (!props || (!this.fork && !context)) {
            console.warn(`You must call super(props, context) from the constructor of a component -
            if the class is not a component, don't decorate it with @Component!`);
        }

        // Swap out the render function, so we can bind to it (telling React to re-render when it needs to)
        this[_originalRender] = this.render;
        let originalRender = this.render && this.render.bind(this);
        let binder;
        this.render = () => {
            if (!binder) {
                // Create a new binder: This always executes the getter immediately, so we just read it back
                // from the previousValue. For future updates, we'll get called when the binder is invalidated.
                // Note that we do the forceUpdate() only if the output of the render function changed - this is
                // because forceUpdate is expensive, so we can avoid doing unnecessary work (and also the watch
                // only gets triggered when the render contents actually change)
                let isQueued = false;
                let forceUpdate = () => {
                    isQueued = false;
                    if (binder.dirty) {
                        this.forceUpdate();
                    }
                };
                let onInvalidate = () => {
                    // Normally we throttle updates (in case a component changes a lot!), but sometimes this is
                    // undesirable - e.g. if the component contains input fields, you may want them to update immediately,
                    // no matter how fast the value changes (otherwise you get artifacts like the cursor moving to the end
                    // of the input). You have to explicitly turn this off, via `@Component({throttleUpdates: false})`.
                    if (this.throttleUpdates === false) {
                        forceUpdate();
                        return;
                    }

                    // Throttling: When invalidated, we'll only update at most once per rAF.
                    if (!isQueued) {
                        forceUpdate();
                        TaskQueue.push(forceUpdate, 100000);
                        isQueued = true;
                    }
                };
                binder = this.link(new Binder(originalRender, undefined, true, onInvalidate, undefined, this));
            }
            else {
                binder.apply();
            }

            // React forbids returning `undefined` from render; we must return null instead.
            return binder.previousValue !== undefined ? binder.previousValue : null;
        };

        // Swap out the componentWillUpdate:
        let originalComponentWillUpdate = this.componentWillUpdate && this.componentWillUpdate.bind(this);
        this.componentWillUpdate = (nextProps, ...args) => {
            for (let key in this.props) {
                // We have to signal a change if any of the props change, so that any watches that depend on them will trigger!
                if (this.props[key] !== nextProps[key]) {
                    BinderRecordChange(this, key);
                }
            }

            if (originalComponentWillUpdate) {
                originalComponentWillUpdate(nextProps, ...args);
            }
        };

        // Handle scope
        this[_scope] = this.context && this.context.scope;
        if (this.fork) {
            this[_scope] = this.link(this[_scope] ? this[_scope].fork() : new Scope);
            let originalGetChildContext = this.getChildContext && this.getChildContext.bind(this);
            this.getChildContext = () => {
                let context = originalGetChildContext ? originalGetChildContext() : {};
                context.scope = this[_scope];
                return context;
            };
        }
        else if (!this[_scope]) {
            // Note: We don't error here, because sometimes people decorate a class that's not a component with @Component.
            // If scope is actually used, there will still be an error further down the line, but this warning should help explain it!
            console.warn('A top-level component was instantiated without a forked scope - please change to @Component({ fork: true })');
        }

        let originalComponentWillUnmount = this.componentWillUnmount && this.componentWillUnmount.bind(this);
        this.componentWillUnmount = () => {
            if (originalComponentWillUnmount) {
                originalComponentWillUnmount();
            }
            this.dispose();
        };
    }

    /**
     * Special getter for accessing scope
     */
    get scope() {
        return this[_scope];
    }

    /**
     * Special getter for accessing children
     */
    get children() {
        return this.renderChildren();
    }

    /**
     * Rendering child elements
     */
    renderChildren(name = 'children', args) {
        if (!args && name instanceof Array) {
            args = name;
            name = 'children';
        }
        if (args && !(args instanceof Array)) {
            throw new Error('args parameter to renderChildren() must be an array');
        }
        args = args || [];

        // React doesn't support namespaced tags/attributes, so need to strip out colons
        name = name.replace(/:/g, '_');

        BinderRecordEvent(this, name);
        let children = this.props[name];

        // Apply the arguments
        if (typeof children === 'function') {
            children = children(...args);
        }
        else if (children instanceof Array) {
            children = children.map(child => typeof child === 'function' ? child(...args) : child);
        }

        return children;
    }

    /**
     * Support undeclaredAttributes
     * Note: Right now this takes a prefix, not a namespace, because React doesn't support namespaced attributes
     */
    undeclaredAttributes(prefix) {
        let childAttributes = {};
        let attributes = this[definedAttributes] || {};
        Object.keys(this.props).forEach(name => {
            if (!attributes[name]) {
                let childName = name;
                let prefixIndex = prefix && name.indexOf(prefix);
                if (prefixIndex === 0) {
                    childName = childName.substring(prefix.length);
                }
                childAttributes[childName] = this.props[name];
            }
        });
        return childAttributes;
    }

    /**
     *  Override trigger because we need to handle custom events
     */
    trigger(eventName, ...args) {
        if (!eventName) {
            return;
        }

        // Handle triggering custom events:
        let camelCaseName = getEventHandler(eventName);
        let handler = this.props[camelCaseName];
        if (typeof handler === 'function') {
            handler(...args);
        }
        else if (handler) {
            console.warn('Ignoring non-function event handler: ' + camelCaseName);
        }

        return SignalDispatcher.prototype.trigger.call(this, eventName, ...args);
    }
}

/**
 * Copy over the methods from Disposable and SignalDispatcher
 */

let copyPrototype = (prototypeObj) => {
    Object.getOwnPropertyNames(prototypeObj).forEach(key => {
        if (!Component.prototype.hasOwnProperty(key)) {
            Component.prototype[key] = prototypeObj[key];
        }
    });
};

copyPrototype(Disposable.prototype);
copyPrototype(SignalDispatcher.prototype);
