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
import { renderIntoDocument as render } from 'react-dom/test-utils';
import { TaskQueue } from '@twist/core';

describe('@Component decorator', () => {

    it('Basic @Component with an @Attribute', () => {

        let textElement;

        @Component({ fork: true })
        class MyComponent {
            @Attribute name;

            render() {
                return <div ref={ element => textElement = element }>{ this.name }</div>;
            }
        }

        // Attribute should be rendered in DOM:
        render(<MyComponent name="Bob" />);
        assert.equal(textElement.textContent, 'Bob');
    });

    it('Basic @Component with an @Observable that updates', () => {

        class State {
            @Observable name = 'Bob';
        }
        let state = new State;

        let textElement;

        @Component({ fork: true })
        class MyComponent {
            @Attribute name;

            render() {
                return <div ref={ element => textElement = element }>{ state.name }</div>;
            }
        }

        // Attribute should be rendered in DOM:
        render(<MyComponent name="Bob" />);
        assert.equal(textElement.textContent, 'Bob');

        // Should update when we modify the observable
        state.name = 'Dave';
        TaskQueue.run();
        assert.equal(textElement.textContent, 'Dave');
    });

    it('@Component should propagate scope', () => {

        let textElement;

        @Component
        class Component1 {
            render() {
                return <div ref={ element => textElement = element }>{ this.scope.name }</div>;
            }
        }

        @Component
        class Component2 {
            render() {
                return <Component1/>;
            }
        }

        @Component({ fork: true })
        class Component3 {
            constructor(props, context) {
                super(props, context);
                this.scope.name = 'Bob';
            }
            render() {
                return <Component2/>;
            }
        }

        // Attribute should be rendered in DOM:
        render(<Component3 name="Bob" />);
        assert.equal(textElement.textContent, 'Bob');
    });

    it('@Component should propagate scope', () => {

        let textElement;

        @Component
        class Component1 {
            render() {
                return <div ref={ element => textElement = element }>{ this.scope.name }</div>;
            }
        }

        @Component
        class Component2 {
            render() {
                return <Component1/>;
            }
        }

        @Component({ fork: true })
        class Component3 {
            constructor(props, context) {
                super(props, context);
                this.scope.name = 'Bob';
            }
            render() {
                return <Component2/>;
            }
        }

        // Attribute should be rendered in DOM:
        render(<Component3 name="Bob" />);
        assert.equal(textElement.textContent, 'Bob');
    });

    it('@Component should support events', () => {

        let buttonElement;
        let events = [];

        @Component({ fork: true, events: [ 'accept' ] })
        class MyComponent {
            @Attribute name;

            constructor(props, context) {
                super(props, context);

                this.on('accept', val => events.push('on_' + val));
            }

            render() {
                return <button ref={ element => buttonElement = element } onClick={ this.trigger('accept', 'a') }>Button</button>;
            }
        }

        render(<MyComponent onAccept={ val => events.push('onAccept_' + val) }/>);

        buttonElement.click();
        assert.deepEqual(events, [ 'onAccept_a', 'on_a' ]);
    });

    it('@Component can render children', () => {
        let divElement;

        @Component({ fork: true })
        class MyComponent {
            render() {
                return <div ref={ element => divElement = element }>{ this.children }</div>;
            }
        }

        render(<MyComponent><h1>Test Header</h1><div>Test Content</div></MyComponent>);

        assert.equal(divElement.innerHTML, '<h1>Test Header</h1><div>Test Content</div>');
    });

    it('@Component can render children with arguments', () => {
        let divElement;

        @Component({ fork: true })
        class MyComponent {
            render() {
                return <div ref={ element => divElement = element }>{ this.renderChildren([ 'Hello' ]) }</div>;
            }
        }

        render(<MyComponent as={ message }><h1>Test Header</h1><div>{ message }</div></MyComponent>);

        assert.equal(divElement.innerHTML, '<h1>Test Header</h1><div>Hello</div>');
    });

    it('@Component can render named children', () => {
        let divElement;

        @Component({ fork: true })
        class MyComponent {
            render() {
                return <div ref={ element => divElement = element }>{ this.renderChildren('test:content') }</div>;
            }
        }

        render(<MyComponent><h1>Test Header</h1><test:content>Test Content</test:content></MyComponent>);

        assert.equal(divElement.innerHTML, 'Test Content');
    });

    it('@Component can render named children with arguments', () => {
        let divElement;

        @Component({ fork: true })
        class MyComponent {
            render() {
                return <div ref={ element => divElement = element }>{ this.renderChildren('test:content', [ 'Hello' ]) }</div>;
            }
        }

        render(<MyComponent><h1>Test Header</h1><test:content as={ message }>{ 'Test Content ' + message }</test:content></MyComponent>);

        assert.equal(divElement.innerHTML, 'Test Content Hello');
    });

    it('@Component can pass through undeclared attributes', () => {
        let divElement;

        @Component({ fork: true })
        class MyComponent {
            @Attribute x;

            render() {
                return <div ref={ element => divElement = element }><div { ...this.undeclaredAttributes() }/></div>;
            }
        }

        render(<MyComponent x="a" y="b" />);

        assert.equal(divElement.innerHTML, '<div y="b"></div>');
    });

    it('@Component ignores unknown parameters', () => {
        let divElement;

        @Component({ fork: true, scope: true })
        class MyComponent {
            constructor() {
                super();
                this.scope.x = 'test';
            }

            render() {
                return <div ref={ divElement }><div>{ this.scope.x }</div></div>;
            }
        }

        render(<MyComponent />);

        assert.equal(divElement.innerHTML, '<div>test</div>');
    });

    it('Rendering undefined is all right.', () => {
        @Component({ fork: true })
        class MyComponent {
            render() {
                // This would throw in normal React.
            }
        }
        render(<MyComponent />);
    });

});
