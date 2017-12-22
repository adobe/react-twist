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

// We make a TODO item mutable, so you can directly bind to it, e.g. the isCompleted flag
@Store({ mutable: true })
export default class Todo {
    @State.byVal id;
    @State.byVal title = '';
    @State.byVal description = '';
    @State.byBooleanVal isCompleted = false;
}
