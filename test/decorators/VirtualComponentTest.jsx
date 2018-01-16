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

    @Attribute elements;
    @Attribute name;

    constructor() {
        super();
        // Virtual item
        this.data = new List({}).linkToComponent(this);
    }

    compute() {
        let x = [];
        this.data.children.forEach(item => x.push(item.name));
        return x.join(',');
    }

    render() {
        return <g>
            <div>{ this.name }</div>
            <div ref={ this.elements[0] }>{ this.data.children.length }</div>
            <div ref={ this.elements[1] }>{ this.data.children.length > 0 ? 'yes' : 'no' }</div>
            <div ref={ this.elements[2] }>{ this.compute() }</div>
            { this.props.children }
        </g>;
    }
}

/**
    Tests
**/

describe('@VirtualComponent decorator', () => {

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
    });

});
