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

function flatten(arr) {
    return arr.filter(content => !/^\s+$/.test(content)).reduce((a, b) => a.concat(b instanceof Array ? flatten(b) : b), []);
}

function instantiateContent(content, context) {
    try {
        let ContentClass = content.type;
        return new ContentClass(content.props, context);
    }
    catch (e) {
        console.error(`Unexpected virtual type: ${content.type}. You cannot use concrete HTML tags in a virtual component - all components must themselves be virtual`);
    }
}

function propsDiffer(propsA, propsB) {
    for (let key in propsA) {
        if (propsA.hasOwnProperty(key) && propsA[key] !== propsB[key]) {
            return false;
        }
    }
    for (let key in propsB) {
        if (propsB.hasOwnProperty(key) && propsA[key] !== propsB[key]) {
            return false;
        }
    }
    return true;
}

@Component({ fork: true })
export default class BaseVirtualComponent {

    @Attribute _index;

    _dirty = true;

    constructor(props, context) {
        super(props, context);
        this.init && this.init();
    }

    forceUpdate() {
        this._dirty = true;
        this.doUpdate();
    }

    @Task
    doUpdate() {
        // TODO: Avoid too many renders
        if (this._dirty) {
            this.virtualRender();
        }
    }

    virtualRender() {
        if (!this._dirty) {
            return;
        }

        this._dirty = false;

        let contents = this.render();
        let childContext = this.getChildContext();

        this._items = this._items || [];

        if (contents === null) {
            return;
        }

        if (!(contents instanceof Array)) {
            contents = [ contents ];
        }

        // Sometimes the array can contain other arrays: Need to flatten it out:
        // TODO We could do this check more efficiently so we don't need to create a new array if not necessary
        contents = flatten(contents);

        for (let i = 0; i < contents.length; i++) {
            let content = contents[i];
            let item = this._items[i];

            if (item && !(item instanceof content.type)) {
                this.unlink(item);
                item = undefined;
            }
            if (item && (propsDiffer(content.props, item.props) || propsDiffer(childContext, item.context))) {
                item.componentWillUpdate(content.props, childContext);
                item.forceUpdate();
                item.props = content.props;
                item.context = childContext;
                item.virtualRender();
            }
            if (!item) {
                this._items[i] = this.link(instantiateContent(content, childContext));
                this._items[i]._parent = this;
                this._items[i].virtualRender();
            }
        }

        // Trigger the layout on us, or whoever
        let layoutContainer = this;
        while (layoutContainer && !layoutContainer.setChildNeedsLayout) {
            layoutContainer = layoutContainer._parent;
        }
        layoutContainer && layoutContainer.setChildNeedsLayout();
    }

    render() {
        return this.props.children || null;
    }

    get children() {
        let items;
        for (let i = 0; i < this._items.length; i++) {
            let item = this._items[i];
            if (!item.layout && !items) {
                // Optimization so we only create a new array if we need to
                items = this._items.slice(0, i);
            }

            if (items) {
                // Not all items are actually virtual items, e.g. LazyItem - we need to skip over it
                if (item.layout) {
                    items.push(item);
                }
                else {
                    items = items.concat(item.children);
                }
            }
        }
        return items || this._items;
    }

    forEach(fn) {
        this.children.forEach(fn);
    }

    any(fn) {
        return this.children.some(fn);
    }

    map(fn) {
        return this.children.map(fn);
    }

    filter(fn) {
        return this.children.filter(fn);
    }

    get hasChildren() {
        return this.children.length > 0;
    }

}
