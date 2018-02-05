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

/* global describe it afterEach */
import assert from 'assert';
import { render } from '@twist/react/test-utils';

@Component
class MyComponent {
    @Attribute name;
    render() {
        return <div>{ this.name }</div>;
    }
}

describe('test-utils', () => {

    afterEach(() => {
        render.dispose();
    });

    it('should be able to render JSX into a new div', () => {
        let element = render(<MyComponent name="A Name" />);
        assert.equal(element.parentElement, null);
        assert.equal(element.nodeName, 'DIV');
        assert.equal(element.firstElementChild.textContent, 'A Name');
    });

    it('should be able to render a function that returns JSX into a new div', () => {
        let element = render(() => <MyComponent name="A Name" />);
        assert.equal(element.parentElement, null);
        assert.equal(element.nodeName, 'DIV');
        assert.equal(element.firstElementChild.textContent, 'A Name');
    });

    it('should be able to render JSX into the document body', () => {
        let element = render.intoBody(<MyComponent name="A Name" />);
        assert.equal(element.parentElement.nodeName, 'BODY');
        assert.equal(element.nodeName, 'DIV');
        assert.equal(element.firstElementChild.textContent, 'A Name');

        // Disposing should detach the node from the body
        render.dispose();
        assert.equal(element.parentElement, null);
    });

    it('should be able to render a function that returns JSX into the document body', () => {
        let element = render.intoBody(() => <MyComponent name="A Name" />);
        assert.equal(element.parentElement.nodeName, 'BODY');
        assert.equal(element.nodeName, 'DIV');
        assert.equal(element.firstElementChild.textContent, 'A Name');

        // Disposing should detach the node from the body
        render.dispose();
        assert.equal(element.parentElement, null);
    });

});
