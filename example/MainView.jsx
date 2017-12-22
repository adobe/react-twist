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

import PropTypes from 'prop-types';
import MainViewLess from './MainView.less';
import MainStore from './model/MainStore';

import { remoteDevMiddleware } from '@twist/core';

var INITIAL_STATE = {
    user: {
        firstName: 'Test',
        lastName: 'User'
    },
    todo: {
        title: 'My TODO List',
        items: [
            {
                id: 'id_12345',
                title: 'That Thing',
                description: 'I need to fix'
            }
        ]
    }
};

var createId = () => 'id_' + Math.random();

var ASYNC_TODO = function(store) {
    var id = createId();
    store.dispatch('ADD_TODO', id);

    setTimeout(() => store.dispatch('EDIT_TODO', { id, title: 'Delayed Title' }), 1000);
};

@Component({ throttleUpdates: false })
class TodoItem {
    @Attribute(PropTypes.object) item;
    @Attribute(PropTypes.number) index;

    @Observable title;

    constructor(props, context) {
        super(props, context);

        // Local state - this is like "checking-out" some data from the store - we can bind to
        // it and change it because it's local, and we choose when to dispatch an action to the
        // store, to commit it.
        this.watch(() => this.item.title, value => this.title = value);
    }

    save() {
        this.scope.store.dispatch('EDIT_TODO', { id: this.item.id, title: this.title });
    }

    onKeyPress(e) {
        if (e.key === 'Enter') {
            this.save();
        }
    }

    render() {
        console.warn('RENDER TodoItem' + this.index);
        return <div>
            <input type="checkbox" bind:checked={ this.item.isCompleted } />
            <input class={ MainViewLess.userName } onKeyPress={ e => this.onKeyPress(e) } bind:value={ this.title } placeholder="Enter something..." />
        </div>;
    }
}

@Component({ fork: true, throttleUpdates: false })
export default class MainView {
    @Observable userName;

    constructor(props, context) {
        super(props, context);

        // Initialise the store - this should be done at the top level of the application
        this.scope.store = this.link(new MainStore(INITIAL_STATE, remoteDevMiddleware));

        // Local state - this is like "checking-out" some data from the store - we can bind to
        // it and change it because it's local, and we choose when to dispatch an action to the
        // store, to commit it.
        this.watch(() => this.scope.store.user.firstName, value => this.userName = value);
    }

    addTodo() {
        this.scope.store.dispatch('ADD_TODO', createId());
    }

    addTodoAsync() {
        this.scope.store.dispatch(ASYNC_TODO);
    }

    saveName() {
        this.scope.store.dispatch('SET_USERNAME', this.userName);
    }

    onKeyPress(e) {
        if (e.key === 'Enter') {
            this.saveName();
        }
    }

    render() {
        console.warn('RENDER MainView');

        return <div class={ MainViewLess.container } >

            <div class={ MainViewLess.congrats }>
                <h1>React-Twist Test App</h1>
                <p>Full Name (derived data): <b>{ this.scope.store.user.fullName }</b></p>
            </div>

            <div class={ MainViewLess.sample }>
                <h3 class={ MainViewLess.header }>
                    Hello { this.userName || 'World' }!
                    <br/>
                    Change your name, and press enter to save.
                </h3>
                <input class={ MainViewLess.userName } type="text" onKeyPress={ e => this.onKeyPress(e) } bind:value={ this.userName } placeholder="Type your name" />
            </div>

            <div style-text-align="left" class={ MainViewLess.sample }>
                <h3 class={ MainViewLess.header }>TODO List</h3>
                <repeat for={ (item, index) in this.scope.store.todo.items }>
                    <TodoItem item={ item } key={ index } index={ index } />
                </repeat>
                <button onClick={ () => this.addTodo() }>Add TODO</button>
                <button onClick={ () => this.addTodoAsync() }>Add TODO With Async Title</button>
            </div>
        </div>;
    }
}
