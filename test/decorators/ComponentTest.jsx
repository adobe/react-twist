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
import { TaskQueue, ObservableArray } from '@twist/core';
import { Simulate } from 'react-dom/test-utils';

// Used by the tests if they need to bind to an external observable
class State {
    @Observable name = 'Bob';
    @Observable show = false;
}

describe('@Component decorator', () => {

    afterEach(() => {
        render.dispose();
    });

    it('Basic @Component with an @Attribute', () => {

        let textElement;

        @Component
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
        let state = new State;
        let textElement;
        let renderCount = 0;

        @Component
        class MyComponent {
            render() {
                renderCount++;
                return <div ref={ element => textElement = element }>{ state.name }</div>;
            }
        }

        // Attribute should be rendered in DOM:
        render(<MyComponent />);
        assert.equal(textElement.textContent, 'Bob');
        assert.equal(renderCount, 1);

        // Should update when we modify the observable
        state.name = 'John';
        state.name = 'Charles';
        state.name = 'Harry';
        state.name = 'Henry';
        state.name = 'Houdini';
        state.name = 'Dave';
        TaskQueue.run();
        assert.equal(textElement.textContent, 'Dave');
        assert.equal(renderCount, 2);
    });

    it('Basic @Component with an @Observable that updates via a watch', () => {
        let state = new State;
        let textElement;
        let renderCount = 0;

        sinon.spy(console, 'error');

        @Component
        class MyComponent {
            items = new ObservableArray;

            constructor() {
                super();

                // It's bad practice to use watches to update derived state, but this is to test
                // that if you _do_, it'll update as expected.
                this.watch(() => state.name, newName => {
                    if (newName === null) {
                        for (let i = 0; i < 10; i++) {
                            this.items.push(i);
                        }
                    }
                });
            }

            render() {
                renderCount++;
                return <div ref={ element => textElement = element }>{ this.items.join(',') }</div>;
            }
        }

        // Attribute should be rendered in DOM:
        render(<MyComponent />);
        assert.equal(textElement.textContent, '');
        assert.equal(renderCount, 1);

        // Should update when we modify the observable
        state.name = null;
        TaskQueue.run();
        assert.equal(textElement.textContent, '0,1,2,3,4,5,6,7,8,9');
        assert.equal(renderCount, 2);

        assert.equal(console.error.callCount, 0);
        console.error.restore();
    });

    it('Nested @Component passing data via an attribute that updates', () => {
        let state = new State;
        let renderCount = 0;
        let textElement;

        @Component
        class MyNestedComponent {
            @Attribute name;

            render() {
                renderCount++;
                return <div ref={ textElement }>{ this.name }</div>;
            }
        }

        @Component
        class MyComponent {
            render() {
                return <MyNestedComponent name={ state.name }/>;
            }
        }

        // Attribute should be rendered in DOM:
        render(<MyComponent />);
        assert.equal(textElement.textContent, 'Bob');
        assert.equal(renderCount, 1);

        // Should update when we modify the observable
        state.name = 'Dave';
        TaskQueue.run();
        assert.equal(textElement.textContent, 'Dave');
        assert.equal(renderCount, 2);

        // Should update when we modify the observable
        state.name = 'Dave2';
        TaskQueue.run();
        assert.equal(textElement.textContent, 'Dave2');
        assert.equal(renderCount, 3);
    });

    it('Nested @Component passing data via an attribute that updates - reading from this.props', () => {
        let state = new State;
        let renderCount = 0;
        let textElement;

        @Component
        class MyNestedComponent {
            render() {
                renderCount++;
                return <div ref={ textElement }>{ this.props.name }</div>;
            }
        }

        @Component
        class MyComponent {
            render() {
                return <MyNestedComponent name={ state.name }/>;
            }
        }

        // Attribute should be rendered in DOM:
        render(<MyComponent />);
        assert.equal(textElement.textContent, 'Bob');
        assert.equal(renderCount, 1);

        // Should update when we modify the observable
        state.name = 'Dave';
        TaskQueue.run();
        assert.equal(textElement.textContent, 'Dave');
        assert.equal(renderCount, 2);

        // Should update when we modify the observable
        state.name = 'Dave2';
        TaskQueue.run();
        assert.equal(textElement.textContent, 'Dave2');
        assert.equal(renderCount, 3);
    });

    it('Nested @Component passing data via this.children with an @Observable that updates', () => {
        let state = new State;
        let textElement;

        @Component
        class MyNestedComponent {
            render() {
                return <div ref={ textElement }>{ this.children }</div>;
            }
        }

        @Component
        class MyComponent {
            render() {
                return <MyNestedComponent>{ state.name }</MyNestedComponent>;
            }
        }

        // Attribute should be rendered in DOM:
        render(<MyComponent />);
        assert.equal(textElement.textContent, 'Bob');

        // Should update when we modify the observable
        state.name = 'Dave';
        TaskQueue.run();
        assert.equal(textElement.textContent, 'Dave');
    });

    it('Nested @Component with variable this.children that updates', () => {
        let state = new State;
        let textElement;

        @Component
        class MyNestedComponent {
            render() {
                return <div ref={ textElement }>{ this.children }</div>;
            }
        }

        @Component
        class MyComponent {
            render() {
                return <MyNestedComponent>
                    <if condition={ state.show }><div>A</div></if>
                    <div>B</div>
                </MyNestedComponent>;
            }
        }

        // Attribute should be rendered in DOM:
        render(<MyComponent />);
        assert.equal(textElement.innerHTML, '<div>B</div>');

        // Should update when we modify the observable
        state.show = true;
        TaskQueue.run();
        assert.equal(textElement.innerHTML, '<div>A</div><div>B</div>');
    });

    it('Nested @Component with variable props that updates', () => {
        let state = new State;
        let textElement;

        @Component
        class MyNestedComponent {
            @Attribute name;
            render() {
                return <div ref={ textElement }>{ this.name || 'NoName' }</div>;
            }
        }

        @Component
        class MyComponent {
            render() {
                return <g>
                    <if condition={ state.show }>
                        <MyNestedComponent name="Bob" />
                    </if>
                    <else>
                        <MyNestedComponent />
                    </else>
                </g>;
            }
        }

        // Attribute should be rendered in DOM:
        render(<MyComponent />);
        assert.equal(textElement.textContent, 'NoName');

        // Should update when we modify the observable
        state.show = true;
        TaskQueue.run();
        assert.equal(textElement.textContent, 'Bob');
    });

    it('@Component should call lifecycle events in correct order', () => {
        let events = [];

        class Data {
            @Observable static name;
        }

        @Component
        class MyComponent {
            @Attribute name;
            constructor() {
                super();
                events.push('constructor');
                this.link(() => events.push('dispose'));
            }
            componentWillUpdate() {
                events.push('will_update');
            }
            componentDidUpdate() {
                events.push('did_update');
            }
            componentDidMount() {
                events.push('did_mount');
            }
            componentWillUnmount() {
                events.push('will_unmount');
            }
            render() {
                events.push('render');
                return <div>{ this.name }</div>;
            }
        }

        @Component
        class MyRootComponent {
            render() {
                return <MyComponent name={ Data.name } />;
            }
        }

        let rootComp;
        render(<MyRootComponent ref={ rootComp } name={ Data.name }/>);
        assert.deepEqual(events, [ 'constructor', 'render', 'did_mount' ]);

        events = [];
        Data.name = 'Bob';
        TaskQueue.run();
        assert.deepEqual(events, [ 'will_update', 'render', 'did_update' ]);

        events = [];
        render.dispose();
        assert.deepEqual(events, [ 'will_unmount', 'dispose' ]);
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

        @Component
        class Component3 {
            constructor() {
                super();
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

        @Component
        class Component3 {
            constructor() {
                super();
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

    it('@Component should warn if used at top-level without forking the scope', () => {

        sinon.spy(console, 'warn');

        @Component({ fork: false })
        class MyComponent {
        }

        render(<MyComponent />);

        assert(console.warn.calledWith('`MyComponent` was instantiated at the top-level without a forked scope - `@Component({ fork: false })` is not supported for top-level components.'));
        console.warn.restore();
    });

    it('@Component should support events', () => {

        let buttonElement;
        let events = [];

        @Component({ events: [ 'accept' ] })
        class MyComponent {
            @Attribute name;

            constructor() {
                super();

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

    it('@Component ignores triggering invalid events', () => {

        @Component({ events: [ 'accept' ] })
        class MyComponent {
            render() {
                return <div>Test</div>;
            }
        }

        let comp;
        render(<MyComponent ref={ comp } onAccept={ 'not a function' }/>);

        sinon.spy(console, 'warn');

        // Can trigger a null event - it's ignored
        comp.trigger();
        assert.equal(console.warn.callCount, 0);

        // Can trigger a custom event - but since it isn't a function we get a warning instead
        comp.trigger('accept');
        assert(console.warn.calledWith('Ignoring non-function event handler `onAccept`.'));
        console.warn.restore();
    });

    it('@Component can render children', () => {
        let divElement;

        @Component
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

        @Component
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

        @Component
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

        @Component
        class MyComponent {
            render() {
                return <div ref={ element => divElement = element }>{ this.renderChildren('test:content', [ 'Hello' ]) }</div>;
            }
        }

        render(<MyComponent><h1>Test Header</h1><test:content as={ message }>{ 'Test Content ' + message }</test:content></MyComponent>);

        assert.equal(divElement.innerHTML, 'Test Content Hello');
    });

    it('@Component.renderChildren should throw an error if arguments not an array', () => {
        @Component
        class MyComponent {
        }
        assert.throws(() => new MyComponent({}).renderChildren('test:content', 'notanarray'), /args parameter to renderChildren\(\) must be an array/);
    });

    it('@Component can pass through undeclared attributes', () => {
        let divElement;

        @Component
        class MyComponent {
            @Attribute x;

            render() {
                return <div ref={ element => divElement = element }><div { ...this.undeclaredAttributes() }/></div>;
            }
        }

        render(<MyComponent x="a" y="b" />);

        assert.equal(divElement.innerHTML, '<div y="b"></div>');
    });

    it('@Component can pass through undeclared attributes, using a namespace prefix', () => {
        let divElement;

        @Component
        class MyComponent {
            render() {
                return <div ref={ element => divElement = element }><div { ...this.undeclaredAttributes('ns_') }/></div>;
            }
        }

        render(<MyComponent ns_x="a" y="b" ns_z="c" diff_w="d" />);

        assert.equal(divElement.innerHTML, '<div x="a" z="c"></div>');
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

    it('@Component should give warning if there are no props', () => {
        sinon.spy(console, 'warn');

        @Component
        class MyComponent {
            constructor() {
                super(undefined);
            }
        }

        new MyComponent();
        assert(console.warn.calledWith(`You must call super(props, context) from the constructor of a component -
            if the class is not a component, don't decorate it with @Component!`));
        console.warn.restore();
    });

    it('@Component should support a throttleUpdates:false option to update immediately on every change', () => {
        let comp, textElement;

        @Component({ throttleUpdates: false })
        class MyComponent {
            @Observable text = 'Hello';
            render() {
                return <div ref={ textElement }>{ this.text }</div>;
            }
        }

        render(<MyComponent ref={ comp } />);
        assert.equal(textElement.textContent, 'Hello');

        comp.text = 'Goodbye';
        assert.equal(textElement.textContent, 'Goodbye');

        // Without forceUpdate this will be throttled
        comp.text = 'Hello';
        assert.equal(textElement.textContent, 'Hello');
    });

    it('Should be able to render a component when render() returns undefined', () => {
        @Component
        class MyComponent {
            render() {
                // This would throw in normal React.
            }
        }
        render(<MyComponent />);
    });

    it('Should be able to render a component with an input that uses two-way binding', () => {
        let inputElement, comp;
        let renderCount = 0;

        @Component
        class MyComponent {
            @Observable name = 'Test Name';

            render() {
                renderCount++;
                return <input ref={ inputElement } bind:value={ this.name } />;
            }
        }

        render(<MyComponent ref={ comp }/>);
        assert.equal(renderCount, 1);

        Simulate.change(inputElement, { target: { value: 'Test Another Name' } });
        Simulate.change(inputElement, { target: { value: 'Test Another Name 2' } });

        TaskQueue.run(); // Shouldn't need this when we update the babel transform
        assert.equal(comp.name, 'Test Another Name 2');
        assert.equal(renderCount, 2);
    });

    it('Should be able to render a component that uses two-way binding on an attribute', () => {
        let textElement, comp;
        let renderCount = 0;

        @Component
        class MyNestedComponent {
            @Attribute name;

            render() {
                return this.children;
            }
        }

        @Component
        class MyComponent {
            @Observable name = 'Test Name';
            @Observable nestedComponent;

            render() {
                renderCount++;
                return <MyNestedComponent bind:name={ this.name } ref={ this.nestedComponent }>
                    <div ref={ textElement }>{ this.name + ', ' + (this.nestedComponent && this.nestedComponent.name) }</div>
                </MyNestedComponent>;
            }
        }

        // In the initial render, the nested component reference isn't yet defined
        render(<MyComponent ref={ comp }/>);
        assert.equal(textElement.textContent, 'Test Name, undefined');
        assert.equal(renderCount, 1);

        // On the next render, the reference propagates back up
        TaskQueue.run();
        assert.equal(textElement.textContent, 'Test Name, Test Name');
        assert.equal(renderCount, 2);

        // Should not render again since things are stable
        TaskQueue.run();
        assert.equal(renderCount, 2);

        comp.nestedComponent.name = 'Another Test';
        TaskQueue.run();
        assert.equal(textElement.textContent, 'Another Test, Another Test');
        assert.equal(renderCount, 4); // Renders twice because the name propagates back up

        // Should be in a stable state - so no further rendering on subsequent frames
        TaskQueue.run();
        TaskQueue.run();
        TaskQueue.run();
        assert.equal(renderCount, 4);
    });

    it('Should be able to render a component that passes in an object to a nested component', () => {
        let state = new State;
        let textElement, comp;
        let renderCount = 0;

        @Component
        class MyNestedComponent {
            @Attribute obj;

            render() {
                return this.children;
            }
        }

        @Component
        class MyComponent {
            @Observable nestedComponent;
            @Attribute val;

            render() {
                renderCount++;
                return <MyNestedComponent obj={ { val: 'Test' } } ref={ this.nestedComponent }>
                    <div>{ this.val }</div>
                    <div ref={ textElement }>{ this.nestedComponent && this.nestedComponent.obj && this.nestedComponent.obj.val }</div>
                </MyNestedComponent>;
            }
        }

        sinon.spy(console, 'error');

        render(<MyComponent val={ state.name } ref={ comp }/>);
        assert.equal(textElement.textContent, '');
        assert.equal(console.error.callCount, 0);
        assert.equal(renderCount, 1);

        // Only updates on second render because it needs to get a ref to the nested component
        TaskQueue.run();
        assert.equal(textElement.textContent, 'Test');
        assert(console.error.calledWith('`MyComponent` is in a repeating render loop. Check for cyclic dependencies between observables.'));
        assert.equal(renderCount, 52); // Additional 50 renders before we catch the loop

        // Should be in a stable state - so no further rendering on subsequent frames
        TaskQueue.run();
        TaskQueue.run();
        TaskQueue.run();
        assert.equal(renderCount, 52);

        console.error.restore();
    });

});
