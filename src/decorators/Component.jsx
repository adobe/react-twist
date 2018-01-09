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
import { addAttribute, getEventHandler } from '../internal/AttributeUtils';
import DecoratorUtils from '@twist/core/src/internal/utils/DecoratorUtils';

let allowedOptions = [ 'fork', 'events', 'throttleUpdates' ];

export default DecoratorUtils.makeClassDecorator((target, args) => {
    if (args) {
        Object.keys(args).forEach(key => {
            if (allowedOptions.indexOf(key) === -1) {
                console.warn(`${key} is not a valid option for @Component - ignoring.`);
                return;
            }

            if (key === 'events') {
                target.prototype[key] = (target.prototype[key] || []).concat(args[key]);
            }
            else {
                target.prototype[key] = args[key];
            }
        });
    }

    // Make sure event handlers are defined
    target.prototype.events && target.prototype.events.forEach(eventName => {
        addAttribute(target.prototype, getEventHandler(eventName), PropTypes.func);
    });

    // // Allow scope in the context (both to be passed down and received)
    target.contextTypes = target.contextTypes || {};
    target.contextTypes.scope = PropTypes.object;
    if (args && args.fork) {
        target.childContextTypes = target.childContextTypes || {};
        target.childContextTypes.scope = PropTypes.object;
    }
});
