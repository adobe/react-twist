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

import Todo from './Todo';

@Store
export default class TodoStore {

    @State.byVal title;
    @State.byRefArray(Todo) items;

    itemById(id) {
        var foundItem;
        this.items.forEach(item => {
            if (item.id === id) {
                foundItem = item;
            }
        });
        return foundItem;
    }

    /**
        Action handlers
    **/

    @Action LOGIN() {

    }

    @Action ADD_TODO(id) {
        // console.log('ADD_TODO')
        this.items.push(new Todo({ id }));
    }

    @Action EDIT_TODO(params) {
        // console.log('EDIT_TODO')
        var foundItem = this.itemById(params.id);
        if (foundItem) {

            if (params.title !== undefined) {
                foundItem.title = params.title;
            }
            if (params.isCompleted !== undefined) {
                foundItem.isCompleted = params.isCompleted;
            }
        }
    }
}
