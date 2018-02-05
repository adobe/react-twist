/*
 *  Copyright 2018 Adobe Systems Incorporated. All rights reserved.
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

// Utilities for testing React-Twist components. You must have react-dom installed as a dependency.

import ReactDOM from 'react-dom';

let renderedElements = [];

/**
 * Render the given JSX to the DOM - this remembers the elements so it's
 * easy to dispose later, via `render.dispose()`. It always renders the content
 * inside a new `<div>`, but you can optionally specify a `parentElement` to attach
 * this to (otherwise, the `<div>` is just left floating without a parent).
 *
 * You can also call `render.intoBody()` as a shorthand for providing the
 * document body as the `parentElement` parameter.
 *
 * @param {jsx|function} jsx JSX to render (or a function that returns JSX).
 * @parem {DOMElement} [parentElement] A parent element to attach the rendered content into.
 */
export function render(jsx, parentElement) {
    var el = document.createElement('div');
    if (parentElement) {
        parentElement.appendChild(el);
    }

    if (typeof jsx === 'function') {
        // Put it in a component
        @Component
        class RenderComponent {
            render() {
                return jsx();
            }
        }
        ReactDOM.render(<RenderComponent />, el);
    }
    else {
        ReactDOM.render(jsx, el);
    }

    renderedElements.push(el);
    return el;
}

/**
 * Shorthand for rendering into the document body
 */
render.intoBody = (jsx) => {
    return render(jsx, document.body);
};

/**
 * Dispose any rendered JSX elements
 */
render.dispose = () => {
    renderedElements.forEach(el => {
        ReactDOM.unmountComponentAtNode(el);
        if (el.parentNode) {
            el.parentNode.removeChild(el);
        }
    });
    renderedElements = [];
};
