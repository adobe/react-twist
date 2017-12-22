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

// In React, @Attribute is just a getter over props

import { addAttribute, getChangeHandler } from '../internal/AttributeUtils';
import { Binder } from '@twist/core';
let BinderRecordEvent = Binder.recordEvent;

export default function(propType, alias) {

    if (typeof propType === 'string') {
        // Assume this is the alias, not a propType
        alias = propType;
        propType = undefined;
    }

    return function Attribute(property) {
        const key = property.name;
        const eventKey = getChangeHandler(key);

        let defaultValue = undefined;
        if (property.init) {
            // We can't have defaultProps that depend on the instance of the class.
            // This evaluates with `this` being undefined, so we can detect and warn if it depends on the instance.
            try {
                defaultValue = property.init.apply();
            }
            catch(e) {
                console.warn(`Ignoring default value for attribute "${key}" of ${property.classObject.name} - default attribute values cannot reference "this" in React, since they're defined on the class.`);
            }
        }

        addAttribute(property.classObject, key, propType, defaultValue);
        property.add(key, {
            configurable: true,
            enumerable: false,
            get() {
                BinderRecordEvent(this, key);
                return this.props[key];
            },
            set(val) {
                if (this.props[eventKey]) {
                    // TODO: We should have an option to control whether you want this, e.g. via the prop type
                    this.props[eventKey](val);
                }
                else {
                    console.warn(`Attribute "${key}" of ${property.classObject.name} was modified, but no "${eventKey}" attribute was specified. If you want two-way binding, make sure to use "bind:${key}" as the attribute name.`);
                }
            }
        });

        if (alias) {
            addAttribute(property.classObject, alias, propType, defaultValue);
            property.add(alias, {
                configurable: true,
                enumerable: false,
                get() {
                    BinderRecordEvent(this, key);
                    return this.props[key];
                },
                set(val) {
                    // TODO: We should have an option to control whether you want this, e.g. via the prop type
                    this.props[eventKey] && this.props[eventKey](val);
                }
            });
        }
    };
}
