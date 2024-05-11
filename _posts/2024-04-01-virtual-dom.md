---
layout: post
title: A virtual DOM in 200 lines of JavaScript
city: Póvoa de Varzim, Portugal
---

In this post I'll walk through the implementation of a Virtual DOM in a bit over 200 lines of JavaScript.

The result is full-featured (TodoMVC) and sufficiently performant (updating 10k nodes at 60fps).
It's available on NPM as the [smvc](https://github.com/lazamar/smvc) library.

The main goal is to illustrate the fundamental technique behind tools like React.

React, Vue and the Elm language all simplify the creation of interactive web
pages by allowing you to describe how you'd like the page to look like, and not
worry about adding/removing elements to get there.
They do that through a Virtual DOM.


## The goal of the Virtual DOM

It's not about performance.

The Virtual DOM is an abstraction to simplify the act of modifying a UI.

You describe how you would like your page to look like and the library takes care of taking the DOM
from its current state, to the state you want it to be in.

## The key idea

The library will take over a single DOM element and operate inside of it.

This element should be initially empty, and we operate under the assumption that nothing other than our library will ever modify it.
This will be the root of the user's application.

If only we can modify it, then we can know exactly what is inside this element without needing to inspect it.
How? By keeping track of all modifications we did to it so far.

We will track what is inside our root node by keeping a structure containing a simplified representation of each HTML element.
Or more precisely, each DOM node.

Because this representation is a reflection of a DOM node, but it is not in the real DOM, let's call it a virtual node, which will make up our virtual DOM.

The user will never create real DOM nodes, only those virtual ones.
They will tell us how the entire page should look like by using virtual nodes.
Then our library will take care of modifying the real DOM to make it conform to our representation of it.

To know what to modify, our library will take the virtual DOM created by the user and compare it to the
virtual DOM representing how the page currently looks like. This process is called *diffing*.
It will take note of the differences such as which elements should be added or removed and which properties
should be added or removed. The output of diffing is a virtual DOM *diff*.

Then we will *apply* the changes from that diff to the real DOM. Once we are done with the modifications,
the virtual DOM created by the user has now become the current faithful representation of the real DOM.

So, for the UI part of things we need to:

1. *Create* a virtual representation of the DOM
2. *Diff* virtual DOM nodes
3. *Apply* a virtual DOM diff to an HTML element

After building that we will see how to put such virtual DOM to good use
as a powerful library by adding state handling in just a few lines of code.

## Representing the DOM

We want this structure to contain the minimum amount of information possible to faithfully represent what's in the page.

A DOM node has a tag (`div`, `p`, `span`, etc), properties, and children.
So let's represent them using an object with these properties.


``` javascript
const exampleButton = {
  tag : "button",
  properties: { class: "primary", disabled: true, onClick: doSomething },
  children : [] // an array of virtual nodes
};
```

We also need a way to represent a text node. Text nodes don't have tags, properties, or children.
We can use an object with a single property with the textual content.

``` javascript
const exampleText = {
    text: "Hello World"
};
```

We can differentiate a text virtual node from an element one by checking if the `tag` or `text` property is present.

And that's it! That's our full virtual DOM already specified.

We can create some convenience functions for users to create these kind of nodes.

``` javascript
function h(tag, properties, children) {
    return { tag, properties, children);
}

function text(content) {
    return { text : content };
};
```

Now it's easy to create complex nested structures.

``` javascript
const pausedScreen = h("div", {}, [
    h("h2", {}, text("Game Paused")),
    h("button", { onClick: resumeGame }, [ text("Resume") ]),
    h("button", { onClick: quitGame   }, [ text("Quit") ])
])
```

## Diffing

Before starting the diffing, let's think about what we want the output of the diffing operation to look like.

A diff should describe how an element is to be modified. I can think of a few types of modifications:

* *Create* - add a new node to the DOM. Should contain the virtual DOM node to be added.
* *Remove* - doesn't need to contain any informaiton.
* *Replace* - remove a node, but put a new one in its place. Should contain the node to be added.
* *Modify an existing node* - should contain the properties to be added, the ones to be removed, and an array of modifications to the children.
* *Don't modify* - the element stayed the same, there is nothing to be done.

You might wonder why we have a `replace` modification in addition to the `create` and `remove` ones.
This happens because unless the user gives us a unique identifier for each virtual dom node, we have no way
to find out if the order of an element's children has changed.

Consider this case where the initial dom description looked like this:

``` javascript
{ tag: "div",
  properties: {},
  chidlren: [
   { text: "One" },
   { text: "Two" },
   { text: "Three" }
  ]
}
```

And a subsequent description was like so

``` javascript
{ tag: "div",
  properties: {},
  chidlren: [
   { text: "Three" }
   { text: "Two" },
   { text: "One" },
  ]
}
```

To notice that one and three switched places we would have to compare each child of the first object to each child of the second.
This cannot be done efficiently. So instead we identify elements by their index in the `children` array.
This means that we would `replace` the first and last text nodes of the array.

It also means that we can only use `create` when we are inserting an element as the last child.
So unless we are appending a child we will use `replace`.


Now let's dive right in and implement this `diff` function.

``` javascript

// It takes two nodes to be compared, an old and a new one.
function diffOne(l, r) {
  // First we deal with text nodes. If their text content is not
  // identical, then let's replace the old one for the new one.
  // Otherwise it's a `noop`, which means we do nothing.
  let isText = l.text !== undefined;
  if (isText) {
    return l.text !== r.text
      ? { replace: r }
      : { noop : true };
  }

  // Next we start dealing with element nodes.
  // If the tag changed we should just replace the whole thing.
  if (l.tag !== r.tag) {
    return { replace: r };
  }

  // Now that replacement is out of the way we could only possibly
  // modify the element. So let's start by taking note of properties
  // that should be removed.
  // Any property that is not present in the new node should be removed.
  const remove = [];
  for (const prop in l.properties) {
    if (r.properties[prop] === undefined) {
      remove.push(prop);
    }
  }

  // And now let's check which ones should be set.
  // This includes new and modified properties.
  // So unless the property's value is the same in the old and
  // new nodes we will take note of it.
  const set = {};
  for (const prop in r.properties) {
    if (r.properties[prop] !== l.properties[prop]) {
      set[prop] = r.properties[prop];
    }
  }

  // Lastly we diff the list of children.
  const children = diffList(l.children, r.children);

  return { modify: { remove, set, children } };
}
```

As an optimisation we can notice when there are no property changes and all children modifications are noops so that we can make the element's diff a `noop` too.
([like this](https://github.com/lazamar/smvc/blob/8d8b3a0368deeb400d595542a19ed9d6b578807d/smvc.js#L99-L107))

Diffing the list of children is straightforward enough. We create a list of diffs the size of the longest of the two lists being compared.
If the old one is longer, the extra elements should be removed. If the new one is longer, the extra elements should be created.
All elements in common should be diffed.

``` javascript
function diffList(ls, rs) {
  let length = Math.max(ls.length, rs.length);
  return Array.from({ length })
    .map((_,i) =>
      (ls[i] === undefined)
      ? { create: rs[i] }
      : (rs[i] == undefined)
      ? { remove: true }
      : diffOne(ls[i], rs[i])
    );
}
```

And that's diffing done!

## Applying a diff

We can already create a virtual DOM and diff it. Now it's time to apply the diff to the real DOM.

The `apply` function will take as inputs a real DOM node whose children should be affected and an
array of the diffs created in the previous step. The diffs of this node's children.

`apply` will have no meaningful return value as its main purpose is to perform the side effect of modifying the DOM.

Its implementation is pretty simple, just dispatching the appropriate action to be performed for each child.
The procedures to `create` and `modify` DOM nodes were moved to their own functions.

``` javascript
function apply(el, childrenDiff) {
  let children = Array.from(el.childNodes);

  childrenDiff.forEach((diff, i) => {
    let action = Object.keys(diff)[0];
    switch (action) {
      case "remove":
        children[i].remove();
        break;

      case "modify":
        modify(children[i], diff.modify);
        break;

      case "create": {
        let child = create(diff.create);
        el.appendChild(child);
        break;
      }

      case "replace": {
        let child = create(diff.replace);
        children[i].replaceWith(child);
        break;
      }

      case "noop":
        break;
    }
  });
}
```

### Event listeners

Before tackling creation and modification, let's think about how we would like to handle event listeners.

We want it to be very cheap and easy to add and remove event listeners, and we want to be sure that we never leave any dangling listeners around.

We will also enforce the invariant that for any given node each event should only have a single listener.
This will already be the case with our API given event listeners are specified using keys in the properties object and JavaScript objects cannot have duplicate keys.

Here is an idea. We add to DOM object nodes a special property created by our
library which contains an object where all the user defined event listeners for
that DOM node can be found.

``` javascript
// Create a property `_ui` where we can store data relevant to
// our library directly in the DOM node itself.
// We store the event listeners for that node in this space.
element["_ui"] = { listeners : { click: doSomething } };
```

Now we can use a single function, `listener`, to be the event listener for all events in all nodes.

Once an event is triggered our `listener` function takes it and, using the listeners
object, dispatches it to the appropriate user defined function to handle the event.

``` javascript
function listener(event) {
  const el = event.currentTarget;
  const handler = el._ui.listeners[event.type];
  handler(event);
}
```

So far this gives us the benefit of not needing to call `addEventListener` and `removeEventListener`
every time a user listener function changes. Changing an event listener only requires changing the
value in the `listeners` object. Later we will see a more compelling benefit of this approach.

With this knowledge we can create a dedicated function to add event listeners to DOM nodes.

``` javascript
function setListener(el, event, handle) {
  if (el._ui.listeners[event] === undefined) {
    el.addEventListener(event, listener);
  }

  el._ui.listeners[event] = handle;
}
```

One thing we haven't done yet is to find out whether any given entry in the `properties`
object is an event listener or not.

Let's write a function that will tell us the name of the event to listen to or
`null` if the property isn't for an event listener.

``` javascript
function eventName(str) {
  if (str.indexOf("on") == 0) { // starts with `on`
    return str.slice(2).toLowerCase(); // lowercase name without the `on`
  }
  return null;
}
```

### Properties

Cool, we know how to add event listeners. For attributes we could just call `setAttribute`, right? Well, no.

For some things we should use the `setAttribute` function and for others we should directly set the property in the DOM object.

For example. If you have an `<input type="checkbox">` and call `element.setAttribute("checked", true)` on it, it will not become checked 🙃.
You should instead do `element["checked"] = true`. And that will work.

And how do we know which to use? Well, it is complicated. I just compiled a list based on [what Elm's Html library is doing](https://github.com/elm/html/blob/master/src/Html/Attributes.elm). Here is the result:

``` javascript
let props = new Set([ "autoplay", "checked", "checked", "contentEditable", "controls",
  "default", "hidden", "loop", "selected", "spellcheck", "value", "id", "title",
  "accessKey", "dir", "dropzone", "lang", "src", "alt", "preload", "poster",
  "kind", "label", "srclang", "sandbox", "srcdoc", "type", "value", "accept",
  "placeholder", "acceptCharset", "action", "autocomplete", "enctype", "method",
  "name", "pattern", "htmlFor", "max", "min", "step", "wrap", "useMap", "shape",
  "coords", "align", "cite", "href", "target", "download", "download",
  "hreflang", "ping", "start", "headers", "scope", "span" ]);

function setProperty(prop, value, el) {
  if (props.has(prop)) {
    el[prop] = value;
  } else {
    el.setAttribute(prop, value);
  }
}

```

### Creating and modifying

With all of that in our hands we can now have a go at creating a real DOM node from a virtual DOM one.

``` javascript
function create(vnode) {

   // Create a text node
  if (vnode.text !== undefined) {
    let el = document.createTextNode(vnode.text);
    return el;
  }

  // Create the DOM element with the correct tag and
  // already add our object of listeners to it.
  let el = document.createElement(vnode.tag);
  el._ui = { listeners : {} };

  for (const prop in vnode.properties) {
    let event = eventName(prop);
    let value = vnode.properties[prop];
    // If it's an event set it otherwise set the value as a property.
    (event !== null)
      ? setListener(el, event, value)
      : setProperty(prop, value, el);
  }

  // Recursively create all the children and append one by one.
  for (let childVNode of vnode.children) {
    const child = create(childVNode);
    el.appendChild(child);
  }

  return el;
}
```

The `modify` function is similarly straightforward. It sets and removes the approriate
properties of the node and hands control to the `apply` function for it to change the children.
Notice the corecursion between `modify` and `apply`.

``` javascript
function modify(el, diff) {

  // Remove props
  for (const prop of diff.remove) {
    const event = eventName(prop);
    if (event === null) {
      el.removeAttribute(prop);
    } else {
      el._ui.listeners[event] = undefined;
      el.removeEventListener(event, listener);
    }
  }

  // Set props
  for (const prop in diff.set) {
    const value = diff.set[prop];
    const event = eventName(prop);
    (event !== null)
      ? setListener(el, event, value)
      : setProperty(prop, value, el);
  }

  // Deal with the children
  apply(el, diff.children);
}
```

## Handling state
