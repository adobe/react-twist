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

/* global describe it */
import assert from 'assert';
import sinon from 'sinon';
import { renderIntoDocument as render } from 'react-dom/test-utils';
import PropTypes from 'prop-types';

describe('@Attribute decorator', () => {

    it('@Attribute should take default value', () => {

        let textElement;

        @Component({ fork: true })
        class MyComponent {
            @Attribute name = 'Bob';

            render() {
                return <div ref={ element => textElement = element }>{ this.name }</div>;
            }
        }

        // Default value should be rendered in DOM:
        render(<MyComponent />);
        assert.equal(textElement.textContent, 'Bob');

        // Default value can be overriden:
        render(<MyComponent name="Fred" />);
        assert.equal(textElement.textContent, 'Fred');
    });

    it('@Attribute should take propType', () => {

        let textElement;

        @Component({ fork: true })
        class MyComponent {
            @Attribute(PropTypes.string) name;

            render() {
                return <div ref={ element => textElement = element }>{ this.name }</div>;
            }
        }

        sinon.spy(console, 'error');

        // If proptype doesn't match, should get warning
        render(<MyComponent name={ 2 } />);
        assert.equal(textElement.textContent, 2);

        assert(console.error.calledWith('Warning: Failed prop type: Invalid prop `name` of type `number` supplied to `MyComponent`, expected `string`.\n    in MyComponent'));
        console.error.restore();
    });

    it('@Attribute should take alias', () => {

        let textElement;

        @Component({ fork: true })
        class MyComponent {
            @Attribute('title') name;

            render() {
                return <div ref={ element => textElement = element }>{ this.title }</div>;
            }
        }

        // Should render title as Bob, even though passed as name
        render(<MyComponent name="Bob" />);
        assert.equal(textElement.textContent, 'Bob');
    });

});
