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

export let definedAttributes = Symbol('definedAttributes');

export function getEventHandler(eventName) {
    return 'on' + eventName.charAt(0).toUpperCase() + eventName.slice(1);
}

export function getChangeHandler(attrName) {
    return 'on' + attrName.charAt(0).toUpperCase() + attrName.slice(1) + 'Change';
}

export function addAttribute(prototype, name, propType, defaultValue) {
    const constructor = prototype.constructor;
    prototype[definedAttributes] = prototype[definedAttributes] || {};
    prototype[definedAttributes][name] = true;
    if (propType) {
        constructor.propTypes = constructor.propTypes || {};
        constructor.propTypes[name] = propType;
    }
    if (defaultValue !== undefined) {
        constructor.defaultProps = constructor.defaultProps || {};
        constructor.defaultProps[name] = defaultValue;
    }
}
