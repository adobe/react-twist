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

/**
    Classes used by the tests
**/

@VirtualComponent
class Item {
    @Attribute name;
}

@VirtualComponent
class List {
}

@Component({ fork: true })
class View {

    @Attribute elements = [];
    @Attribute name;

    constructor() {
        super();
        // Virtual item
        this.data = new List({}).linkToComponent(this);
    }

    compute() {
        let x = [];
        this.data.children.forEach(item => x.push(item.name || item.x));
        return x.join(',');
    }

    render() {
        return <g>
            <div>{ this.name }</div>
            <div ref={ this.elements[0] }>{ this.data.children.length }</div>
            <div ref={ this.elements[1] }>{ this.data.children.length > 0 ? 'yes' : 'no' }</div>
            <div ref={ this.elements[2] }>{ this.compute() }</div>
        </g>;
    }
}

/**
    Tests
**/

describe('@VirtualComponent decorator', () => {

    afterEach(() => {
        render.dispose();
    });

    it('Basic @VirtualComponent - should not render', () => {
        let element;
        render(<div ref={ element }>Bob<Item /></div>);
        assert.equal(element.textContent, 'Bob');
    });

    it('linkToComponent requires a component', () => {
        assert.throws(() => new List({}).linkToComponent(), /@VirtualComponent.linkToComponent\(\) expects an @Component as its argument/);
    });

    it('@VirtualComponent cannot have custom render() function', () => {
        @VirtualComponent
        class RenderedVComponent {
            render() {
                return null;
            }
        }
        assert.throws(() => new RenderedVComponent({}), /Virtual components do not support custom render\(\) implementations. Instead, use a normal component that renders virtual components./);
    });

    it('@VirtualComponent should render and be accessible to linked component', () => {
        let elements = [];

        render(<View elements={ elements }>
            <Item name="A" />
            <if condition={ true }><Item name="B" /></if>
            <if condition={ false }><Item name="C" /></if>
            <repeat for={ x in [ 1, 2, 3 ] }>
                <Item name={ 'D' + x } />
            </repeat>
        </View>);
        assert.deepEqual(elements.map(e => e.textContent), [
            '5',
            'yes',
            'A,B,D1,D2,D3'
        ]);
    });

    it('@VirtualComponent should render with only one child', () => {
        let elements = [];

        render(<View elements={ elements }>
            <Item name="A" />
        </View>);
        assert.deepEqual(elements.map(e => e.textContent), [
            '1',
            'yes',
            'A'
        ]);
    });

    it('@VirtualComponent should dynamically update', () => {
        let elements = [];

        class Data {
            @Observable static showB = true;
            @Observable static showC = false;
            static items = new ObservableArray([ 1, 2, 3 ]);
        }

        @Component({ fork: true })
        class MyComponent {
            render() {
                return <View elements={ elements } name={ Data.items.length }>
                    <Item name="A" />
                    <if condition={ Data.showB }><Item name="B" /></if>
                    <if condition={ Data.showC }><Item name="C" /></if>
                    <repeat for={ x in Data.items }>
                        <Item name={ 'D' + x } />
                    </repeat>
                </View>;
            }
        }

        render(<MyComponent />);
        assert.deepEqual(elements.map(e => e.textContent), [
            '5',
            'yes',
            'A,B,D1,D2,D3'
        ]);

        Data.showC = true;
        Data.items.splice(1, 0, 4);
        TaskQueue.run();

        assert.deepEqual(elements.map(e => e.textContent), [
            '7',
            'yes',
            'A,B,C,D1,D4,D2,D3'
        ]);

        Data.showC = false;
        Data.items.splice(1, 2);
        TaskQueue.run();

        assert.deepEqual(elements.map(e => e.textContent), [
            '4',
            'yes',
            'A,B,D1,D3'
        ]);
    });

    it('@VirtualComponent should dynamically update with different child items', () => {
        let elements = [];

        class Data {
            static items = new ObservableArray([ 1, 2 ]);
        }

        @VirtualComponent
        class DifferentItem {
            @Attribute x;
        }

        @Component({ fork: true })
        class MyComponent {
            render() {
                return <View elements={ elements } name={ Data.items.length }>
                    <repeat for={ x in Data.items }>
                        <Item name={ 'Item' + x } />
                    </repeat>
                    <repeat for={ x in Data.items }>
                        <DifferentItem x={ 'DifferentItem' + x } />
                    </repeat>
                </View>;
            }
        }

        render(<MyComponent />);
        assert.deepEqual(elements.map(e => e.textContent), [
            '4',
            'yes',
            'Item1,Item2,DifferentItem1,DifferentItem2'
        ]);

        Data.items.push(3);
        TaskQueue.run();

        assert.deepEqual(elements.map(e => e.textContent), [
            '6',
            'yes',
            'Item1,Item2,Item3,DifferentItem1,DifferentItem2,DifferentItem3'
        ]);
    });

    it('@VirtualComponent should dynamically update with different props', () => {
        let elements = [];

        class Data {
            @Observable static inject = false;
            static items = new ObservableArray([ 1, 2, 3 ]);
        }

        @Component({ fork: true })
        class MyComponent {
            render() {
                return <View elements={ elements } name={ Data.items.length }>
                    <if condition={ Data.inject }>
                        <Item />
                    </if>
                    <repeat for={ x in Data.items }>
                        <Item name={ 'D' + x } />
                    </repeat>
                </View>;
            }
        }

        render(<MyComponent />);
        assert.deepEqual(elements.map(e => e.textContent), [
            '3',
            'yes',
            'D1,D2,D3'
        ]);

        Data.showC = true;
        Data.items.setAt(0, 4);
        Data.items.setAt(1, 5);
        Data.items.setAt(2, 6);
        TaskQueue.run();

        assert.deepEqual(elements.map(e => e.textContent), [
            '3',
            'yes',
            'D4,D5,D6'
        ]);

        Data.inject = true;
        TaskQueue.run();

        assert.deepEqual(elements.map(e => e.textContent), [
            '4',
            'yes',
            ',D4,D5,D6'
        ]);
    });

    it('@VirtualComponent should give an error if you use DOM elements inside it', () => {
        sinon.spy(console, 'error');

        render(<View>
            <List>
                <div>HTML Element</div>
            </List>
        </View>);

        assert(console.error.calledWith('Unexpected virtual type `div`. You cannot use concrete HTML tags in a virtual component - all components must themselves be virtual.'));
        console.error.restore();
    });

});
