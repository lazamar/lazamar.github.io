---
layout: post
title: Dispatching from inside a reducer in Redux
city: London, UK
---

Redux is just great, but to be fair there isn't an elegant way to perform asynchronous actions on it.

If you try to be sneaky and trigger a `store.dispatch` from your reducer function, you will get a big `Cannot dispatch in a middle of dispatch` error; which isn't very helpful.

To be fair, this constraint is quite reasonable. The goal of the tool is to assure you that the only thing that changes state is the return value of a reducer function. By performing another dispatch in the middle of it, you will have changed the state of the application before returning a value.

While dispatching in the middle of another dispatch is an anti-pattern, scheduling a dispatch for later isn't. As you may know, Redux tries to bring the Elm Architecture to JavaScript, and allowing a reducer to schedule other dispatches is exactly how the Elm language works.

For that we are going to use this very simple middleware:

``` javascript
const asyncDispatchMiddleware = store => next => action => {
  let syncActivityFinished = false;
  let actionQueue = [];

  function flushQueue() {
    actionQueue.forEach(a => store.dispatch(a)); // flush queue
    actionQueue = [];
  }

  function asyncDispatch(asyncAction) {
    actionQueue = actionQueue.concat([asyncAction]);

    if (syncActivityFinished) {
      flushQueue();
    }
  }

  const actionWithAsyncDispatch =
      Object.assign({}, action, { asyncDispatch });

  next(actionWithAsyncDispatch);
  syncActivityFinished = true;
  flushQueue();
};

```

This adds an `asyncDispatch` property to all action objects, which will call `store.dispatch` at any point after your reducer has finished.

Here is an example of how easy and simple asynchronous code becomes.


``` javascript
function reducer(state, action) {
  switch (action.type) {
    case "fetch-start":
      fetch('wwww.example.com')
        .then(r => r.json())
        .then(r => action.asyncDispatch({ type: "fetch-response", value: r }))
      return state;

    case "fetch-response":
      return Object.assign({}, state, { whatever: action.value });;
  }
}
```

This provides a much clearer way to handle asynchronous code than alternatives such as redux-saga and Redux Thunk. Redux Thunk, for example, encourages you to keep some application logic in your action creators, which is not really ideal. I like to have my action creators solely return a simple plain object, that's it. Business logic should be contained in the reducers.

Well. That's basically it. No need to worry about async with Redux any longer.

---
**TL;DR**

- Use the middleware I show above to add a `asyncDispatch` method to all your actions so you can dispatch new actions that will be executed after your current reducer is finished

---
