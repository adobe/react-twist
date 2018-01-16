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
import DecoratorUtils from '@twist/core/src/internal/utils/DecoratorUtils';
let BinderRecordEvent = Binder.recordEvent;


export default DecoratorUtils.makePropertyDecorator((target, property, descriptor, propType, alias) => {
    if (typeof propType === 'string') {
        // Assume this is the alias, not a propType
        alias = propType;
        propType = undefined;
    }

    const eventProperty = getChangeHandler(property);

    let defaultValue = descriptor.value;
    if (descriptor.initializer) {
        // We can't have defaultProps that depend on the instance of the class.
        // This evaluates with `this` being undefined, so we can detect and warn if it depends on the instance.
        try {
            // We need to make sure that `this` is undefined for the initializer, so we can catch this error
            defaultValue = descriptor.initializer.apply();
        }
        catch(e) {
            console.warn(`Ignoring default value for attribute \`${property}\` of \`${target.constructor.name}\` - default attribute values cannot reference \`this\` in React, since they're defined on the class.`);
        }
    }

    addAttribute(target, property, propType, defaultValue);

    let attributeProperty = {
        configurable: true,
        enumerable: false,
        get() {
            BinderRecordEvent(this, property);
            return this.props[property];
        },
        set(val) {
            if (typeof this.props[eventProperty] === 'function') {
                // TODO: We should have an option to control whether you want this, e.g. via the prop type
                this.props[eventProperty](val);
            }
            else {
                console.warn(`Attribute \`${property}\` of \`${target.constructor.name}\` was modified, but no \`${eventProperty}\` attribute was specified. If you want two-way binding, make sure to use \`bind:${property}\` as the attribute name.`);
            }
        }
    };

    if (alias) {
        addAttribute(target, alias, propType, defaultValue);
        Object.defineProperty(target, alias, attributeProperty);
    }

    return attributeProperty;
});
