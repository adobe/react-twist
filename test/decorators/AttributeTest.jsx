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
import sinon from 'sinon';
import { render } from '../Utils';
import { Simulate } from 'react-dom/test-utils';
import PropTypes from 'prop-types';

describe('@Attribute decorator', () => {

    afterEach(() => {
        render.dispose();
    });

    it('@Attribute should take default value', () => {

        let textElement;

        @Component
        class MyComponent {
            @Attribute name = 'Bob' + '';

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

    it('@Attribute should take default value as an expression', () => {

        let textElement;

        @Component
        class MyComponent {
            @Attribute name = 'Bob' + (() => '\'s your uncle')();

            render() {
                return <div ref={ textElement }>{ this.name }</div>;
            }
        }

        // Default value should be rendered in DOM:
        render(<MyComponent />);
        assert.equal(textElement.textContent, 'Bob\'s your uncle');
    });

    it('@Attribute should give warning if you use an expression that contains this as the default value', () => {

        sinon.spy(console, 'warn');

        @Component
        class MyComponent {
            @Attribute name = 'Bob'
            @Attribute address = this.name + '_address';
        }

        assert(MyComponent);
        assert(console.warn.calledWith('Ignoring default value for attribute `address` of `MyComponent` - default attribute values cannot reference `this` in React, since they\'re defined on the class.'));
        console.warn.restore();
    });

    it('@Attribute should take propType', () => {

        let textElement;

        @Component
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

        @Component
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

    it('@Attribute can have its value set, and calls event property', () => {

        @Component
        class MyComponent {
            @Attribute name = 'Bob';
            @Attribute address = 'Unknown';

            render() {
                return null;
            }
        }

        let comp;
        let changeCallback = sinon.spy();
        render(<MyComponent ref={ comp } onNameChange={ changeCallback } />);

        sinon.spy(console, 'warn');

        // Changing an attribute that doesn't have an event should give a warning (and not actually change it)
        comp.address = 'New Address';
        assert.equal(comp.address, 'Unknown');
        assert(console.warn.calledWith('Attribute `address` of `MyComponent` was modified, but no `onAddressChange` attribute was specified. If you want two-way binding, make sure to use `bind:address` as the attribute name.'));
        console.warn.restore();

        // Changing an attribute that _does_ have an event prop should call that function
        comp.name = 'New Name';
        assert(changeCallback.calledWith('New Name'));
    });

    it('@Attribute works with two-way binding', () => {

        let textElement;
        let parentComp;

        @Component
        class MyComponent {
            @Attribute name = 'Bob';

            render() {
                return <div ref={ textElement } onClick={ () => this.name += '_' }>{ this.name }</div>;
            }
        }

        @Component
        class MyContainer {
            @Observable name = 'Dave'

            render() {
                return <MyComponent bind:name={ this.name } />;
            }
        }

        render(<MyContainer ref={ parentComp } />);
        assert.equal(textElement.textContent, 'Dave');
        assert.equal(parentComp.name, 'Dave');

        // Changing the name in the child, should propagate to the parent, since we're using "bind:name"
        Simulate.click(textElement);
        assert.equal(textElement.textContent, 'Dave_');
        assert.equal(parentComp.name, 'Dave_');
    });

    it('@Attribute should throw an error if used on a non-component', () => {

        assert.throws(() => {
            class Test {
                @Attribute name;
            }
            new Test();
        }, /@Attribute can only be used for properties on an @Component. `Test` is not an @Component./);
    });

});
