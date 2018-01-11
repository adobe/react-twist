# React-Twist: It's React... with a Twist!

[![Build Status](https://travis-ci.org/adobe/react-twist.svg?branch=master)](https://travis-ci.org/adobe/react-twist)

[Twist](https://github.com/adobe/twist) is a reactive state-management library for JavaScript applications, and React-Twist lets you use this on top of [React](https://reactjs.org/). In addition to data binding and state-management primitives, React-Twist also adds some syntax enhancements on top of React, designed to maximize your productivity!

## Features

React-Twist adds the following features to React:

- [Data Binding and State Management](#data-binding-and-state-management)
- [Declarative JSX](#declarative-jsx)
- [Enhanced class and style attributes](#enhanced-class-and-style-attributes)
- [Enhanced Component APIs](#enhanced-component-apis)
- [Two-Way Data Binding](#two-way-data-binding)
- [Automatic Performance Optimizations](#automatic-performance-optimizations)

---

### Data Binding and State Management

React-Twist lets you use the [Twist](http://github.com/adobe/twist) state management library with React. The most basic concept in Twist is the notion of _observables_. You can mark a property of any class (including a component) as observable using the `@Observable` decorator -- this lets us know when it's used, and when it changes, so that we can update the view when the model changes. There are equivalents for collections too: `ObservableArray`, `ObservableMap`, and `ObservableSet`.

By default, React only re-renders a component when its props or state changes, so even if your data model used observables, your component wouldn't know when to re-render. To fix that, React-Twist's `@Component` decorator enhances `React.Component` so that it will re-render whenever any observables used in the `render()` function change. This is automatic -- you don't need to tell React when to update!

> Note: To be more precise, `@Component` enhances `React.PureComponent`, so that sub-components don't re-render when the parent component re-renders, unless their input (props) changes. This minimizes the amount of rendering that has to take place, which improves performance.

By themselves, observables provide the "glue" between your model and your view, but they don't tell you how to structure your application state. That's where _stores_ come in -- a store is a serializable container of state that you can make changes to via _actions_. This is explained in more detail in the [Twist documentation](https://github.com/adobe/twist/blob/master/docs/index.md). Twist gives you everything you need to structure your application state, and React-Twist lets you write the views that bind to it!

Here's an example that shows what React-Twist looks like:

```jsx
@Store
class MyStore {
    @State.byVal name;

    @Action SET_NAME(newName) {
        this.name = newName;
    }
}

@Component
class MyView {
    @Attribute(PropTypes.string) title;

    constructor() {
        super();
        this.store = new MyStore({ name: 'Dave' });
    }

    render() {
        return <div>
            <h1>{ this.title }</h1>
            <input value={ this.store.name } onChange={ ev => this.store.dispatch('SET_NAME', ev.target.value) } />
            <div>{ 'Hello ' + this.store.name }</div>
        </div>;
    }
}
```

This is all React code, but we've added a few features on top of React. The most obvious difference is the `@Component` decorator. This extends your class so that it inherits from React-Twist's base component, which in turn inherits from `React.PureComponent`. The `@Attribute` decorator provides a clean way of declaring and accessing props -- when you write `@Attribute name`, then `this.name` is (almost) equivalent to `this.props.name`. We say "almost" because it has two additional benefits than just being a shorthand:

1. It's _observable_, meaning that you can do a programmatic watch on it. In contrast, props are _not_ observable -- React will trigger a component to re-render when they change, but it won't trigger a programmatic watch.
2. You can pass in a [prop type](https://github.com/facebook/prop-types), and React-Twist will automatically add it to the `propTypes` of the component. For example `@Attribute(PropTypes.string) title` in the above example. This makes it much easier for somebody looking at the code for your component to understand what props can be passed in!

In addition to the decorators described above, Twist comes with a whole collection of useful decorators, like `@Bind`, `@Cache`, `@Debounce`, etc.


### Declarative JSX

One of the big features in React-Twist is its toolkit of *structural components*. These are a great abstraction over pure JavaScript, because they make your render function more declarative and easier to read. They also allow React-Twist to optimize the implementation, which will be coming in future releases.

Structural components can be thought of as adding control-flow constructs to JSX -- `<if>`, `<repeat>`, `<using>`, etc. As an example, consider the following render function:

```jsx
render() {
    return <div>
        <h1>My Items</h1>
        <repeat for={ item in this.items }>
            <if condition={ item.onsale }>
                <div>Fantastic Sale Price!</div>
            </if>
            <div>{ item.name }</div>
        </repeat>
    </div>;
}
```

This is equivalent to:

```jsx
render() {
    return <div>
        <h1>My Items</h1>
        {
            this.items.map(item => [
                item.onsale && <div>Fantastic Sale Price!</div>,
                <div>{ item.name }</div>
            ].filter(Boolean))
        }
    </div>;
}
```

The amount of code is very similar, but the declarative style is sometimes easier to read, since it looks closer to an HTML template. React-Twist JSX transforms happen _before_ the React JSX transform, so they're completely optional, and the code they generate is 100% compatible with plain React.

> Note: The `<g></g>` element will soon be deprecated in favor of JSX fragments (`<></>`), which is soon landing in React.


### Enhanced class and style attributes

The built in support for `class` and `style` attributes in React is somewhat limited: `className` can only take a string, and `style` can only take an object. Furthermore, you can only have one of each attribute on an element; if you have multiple attributes with the same name, all except the last will be ignored.

React-Twist provides some enhancements over React that make CSS much easier to handle:

* Multiple attributes: `<div class="x" class={ this.y }>` maps to `<div className={ 'x ' + this.y }>`.
* Boolean class attributes: `<div class-selected={ this.selected }>` maps to `<div className={ selected ? 'selected' : '' }>`.
* Individual style attributes: `<div style-background-color="red">` maps to `<div style={{backgroundColor: 'red'}}>`.
* Style attributes as strings: `<div style="background-color: red">` maps to `<div style={{backgroundColor: 'red'}}>`.

These shorthands save you from having to write complicated string expressions to construct proper className and style attributes.


### Enhanced Component APIs

When you use the `@Component` decorator on a React component, we've already seen that you get data binding for free -- the component will re-render whenever any observables it depends on updates. But wait, there's more! You also get access to all of the `SignalDispatcher` and `Disposable` APIs from Twist. These provide methods like `watch`, `watchCollection`, `trigger`, `on`, `link`, etc -- things that let you manage programmatic watches, events, and auto-disposal of objects that are tied to the lifespan of the component.

The additional APIs that a component has access to are as follows:

* `scope` lets you share data with a tree of components, and is implemented in terms of React's context API. However, it's much easier to use than context -- it's a good place to share your application store.
* `children` is a wrapper over `this.props.children` -- but it's bindable, so it works with programmatic watches (`this.watch(() => this.children, ...)`).
* `undeclaredAttributes()` lets you obtain all the props that were not explicitly declared by `@Attribute` -- this is useful if you want to propagate these to a child element (e.g. `<div { ...this.undeclaredAttributes() }>`).
* `renderChildren([arg1, arg2])` lets you pass arguments to the child elements via the `as` attribute (e.g. `<MyComponent as={ x, y }/>{ x }{ y }</MyComponent>`). This is a shorthand for accepting a _function_ as the children prop, which will be invoked in order to pass in the given arguments.
* `renderChildren(name)` lets you render only the children that are wrapped in a given namespaced tag -- `name` has to be namespaced, like `'dialog:footer'`. In this case, it would render the contents of `<dialog:footer></dialog:footer>` child elements. This is equivalent to looking for `this.props.dialog_footer` (Note that the `:` is converted to `_` because React doesn't support namespaced attributes).
* `renderChildren(name, [arg1, arg2])` lets you render the contents of a namespaced tag, and also pass arguments to it -- e.g. `<dialog:footer as={ x, y }>{ x }{ y }</dialog:footer>`. This looks for the prop `this.props.dialog_footer` -- if it's a function, it will be invoked with the given arguments.

As an example, the following React-Twist code:

```jsx
<Dialog>
    <dialog:header as={ title }><h1>Header { title }</h1></dialog:header>
    Contents
    <dialog:footer><div>Footer</div></dialog:footer>
</Dialog>
```

Is equivalent to (in pure React):

```jsx
<Dialog dialog_header={ title => <h1>Header { title }</h1> } dialog_footer={ <div>Footer</div> } >
    Contents
</Dialog>
```


### Two-Way Data Binding

React doesn't provide any primitives for two-way data binding; you have to register an event listener to detect changes. Here's an example of what this looks like when binding to the input of a text field (assuming that `this.value` is observable):

```jsx
<input value={ this.value } onChange={ ev => this.value = ev.target.value }/>
```

Since this pattern is very common, React-Twist comes with a handy shorthand -- simply prefix the attribute you want to do two-way data binding on with `bind:`. For example, the following is equivalent to the above:

```jsx
<input bind:value={ this.value } />
```

This works for the `value` attribute on input fields, and the `checked` attribute on checkboxes and radio buttons. For the `checked` attribute, the following two lines of code are equivalent:

```jsx
<input type="checkbox" bind:checked={ this.value } />
<input type="checkbox" checked={ this.value } onChange={ () => this.value = !this.value }/>
```

You can do two-way binding when passing data into custom components as well -- other than the special cases of `value` and `checked` on `<input/>` elements, all `bind:xxx` attributes are treated as follows:

```jsx
<MyComponent bind:data={ this.data } />
<MyComponent data={ this.data } onDataChange={ val => this.data = val } />
```

Note that this is really just a naming convention. When you modify an `@Attribute`, it checks to see if an `on<attr>Change` prop was passed in, and if so it'll call it with the new attribute value. You can use `bind:<attr>` to get two-way binding automatically, or you can implement this function yourself if you want more control.

> Note: Right now, `@Attribute` always checks for the `on<attr>Change` prop in its setter, but we want to change this so the component has to explicitly opt into it. Ideally we'd like to do this via a prop-types extension, e.g. `PropTypes.string.isWritable` (similar to `isRequired`), but that would require changes to prop-types, so we'll likely take a different approach.


### Automatic Performance Optimizations

There are a number of pitfalls you need to watch out for with React, that can lead to worse performance. React-Twist tries to optimize certain cases for you, if it's able to do so safely.

#### Event Handler Hoisting

In React, the `render()` function of a component runs every time the component re-renders. This has an implication for event handlers -- for example, if you write the following:

```jsx
render() {
    return <button onClick={ () => this.clickCount++ }>My Button</button>;
}
```

Then every time the component re-renders, a new closure is created for the arrow function in the `onClick` handler. From React's perspective, it's impossible to know that the function does the same thing, so it has to remove and re-add the event handler. This can lead to performance problems and GC pressure.

The solution to this is to "hoist" the function out of render:

```jsx
@Bind
handleClick() {
    this.clickCount++
}

render() {
    return <button onClick={ this.handleClick }>My Button</button>;
}
```

But it's easy to forget to do this. **React-Twist makes life easier by doing this hoisting for you** if it's safe to do so (e.g. if the arrow function references other variables that were defined inside of `render()`, then there's no way around recreating it each time, since these variables could change).


#### Update Throttling

Let's say the `render()` function of your component depends on many different observables, and these change all at once. If we triggered a re-render on every change, we may end up re-rendering the component multiple times, even though there was only a single "logical" change. Similarly, if you make lots of changes in a short period of time, you could end up re-rendering more often than necessary.

React-Twist automatically throttles the rendering of each component, so that it only happens at most once every `requestAnimationFrame` (i.e. 60fps).

The only time you don't want this behavior is when you have a controlled input (like a text input) with two-way data binding. React requires the render to happen synchronously during the change event, otherwise it will temporarily revert to the old value -- the effect of this is that the cursor moves to the end of the text field if you type really fast. You can force a component to update immediately on every change, by specifying `@Component({ throttleUpdates: false })`.

> Note: We're investigating ways to detect this automatically, so you don't have to manually turn of throttled updates.


#### Future Optimizations

One of the biggest performance issues with React is the granularity of updates. If a component has a complex `render()` function, you can end up with performance issues, especially if you're doing a lot of iteration over arrays (e.g. via `<repeat>`).

Right now, React-Twist doesn't do anything to help you with this, but we're planning to add more optimizations in the future to help break apart complex components into smaller ones.



### Other Twist Libraries

TODO


## How does Twist differ from MobX?

At a first glance, Twist looks very similar to MobX. They both have the concept of "observables", and a reactive rendering model, where the view is automatically re-rendered when any observables it depends on are changed. The big differences are in the additional features that React-Twist provides, and a focus on implementation performance. There are two main advantages of React-Twist:

1. React-Twist provides more structure than MobX. The `@Store` and `@State.XXX` decorators help you to structure your application state into a single tree, get import/export to/from JSON for free, and support an action-dispatch mechanism, like in Redux. But under the hood, you still get really efficient data binding based on mutable state, like MobX. You can think of React-Twist as combining the best parts of Redux and MobX!

2. React-Twist is lighter-weight than MobX. We've focused on performance, which means there's less magic under the hood. For example, an `ObservableArray` in React-Twist is just a thin wrapper over an array -- we don't try to simulate the array index operator (you write `a.at(i)` rather than `a[i]`), and elements of the array are not recursively converted into observables.


## Getting Started

To get started with a new project, you'll first need to install the following (via NPM or Yarn):

* `@twist/core` - This includes support for stores, data binding, and application state management.
* `@twist/react` - The React implementation of Twist components.
* `@twist/react-webpack-plugin` - A [webpack](https://webpack.js.org/) plugin that compiles Twist files (Twist has its own Babel transform that runs before React's).

If you're not using webpack, you can also get hold of the Babel configuration directly, using [`@twist/configuration`](https://github.com/adobe/twist-configuration) (this is done automatically by the webpack plugin).

After that, the only thing you need is a `.twistrc` file in the root of your project, that tells Twist which libraries to include (this is also used by the [Twist ESlint plugin](https://github.com/adobe/eslint-plugin-twist)). There are a number of advanced options, but to get up and running, you just need to tell Twist that you're using React-Twist:

```json
{
    "libraries": [
        "@twist/react"
    ]
}
```

In your `webpack.conf.js` you can now include the React Twist plugin - by default this will compile all files that end in `.jsx` with Twist and React:

```js
const ReactTwistPlugin = require('@twist/react-webpack-plugin');

module.exports = {
    ...
    plugins: [
        new ReactTwistPlugin(),
        ...
    ],
    ...
};
```

## Example

To play with the example in this repo, run:

```
yarn install
yarn run watch
```

Then go to `http://localhost:9000/` in your browser.
