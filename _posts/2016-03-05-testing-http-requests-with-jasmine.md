---
layout: post
title: Intercepting HTTP requests in tests with Jasmine
city: London, UK
---

Forget about setting up test servers for unit testing. Give a custom response to
any HTTP request in your code with **jasmine-ajax**.


## Why do it?
Unit testing is very important in making sure that the code we produce is really reliable and alerting us when code changes break something. However, we must admit that testing code with HTTP requests is not the most straight forward thing in
the world. But we should not allow this to drive us away from testing the requests. The hairiest bugs are those that only show itself very far from what caused them. Having tests that check whether the right data is being sent out and whether the right data is arriving is a powerful tool to more easily pinpointing bugs down the road.

## How you would go about doing it

One option is to set-up a test server to receive our code's requests. Then in the server you check whether the request had the data we expected and give an appropriate answer. Back in the main code, we can now check whether the processing of the request was adequate. Well, right there we are already messing things up. Our test code should all be in one place, so that we can make testing easier to debug and to automate. It should also test the minimum amount of code possible. Using a test server there is a great bunch of things that could go wrong in the round trip to the server and back.

Another alternative would be to mock the `XMLHttpRequest` object ourselves. But we don't want to be doing this every time. It also adds more overhead to our testing, which already has a tendency to be left behind regardless of how straight forward it is.

## A better way

Jasmine has a module called **[jasmine-ajax](https://github.com/jasmine/jasmine-ajax)**, which makes testing xhr requests a breeze. Just require `jasmine-ajax` and you are ready to rumble.

Here is an example of it in action :

``` javascript
require('jasmine-ajax')

// Start listening for requests
jasmine.Ajax.install();

//Call the function that will use make a request
myFunctionThatMakesRequests();

//Give a custom answer to my function's request.
request = jasmine.Ajax.requests.mostRecent();
request.respondWith({ status: 200, responseText: "Oh yeah!" });
```

As you can see, we didn't have to change anything in our `myFunctionThatMakesRequests` to make it work. With Jasmine Ajax we can just intercept any xhr request and give it a custom response; or no response at all, if that is what we want. We can construct the response object to make it look whatever way we want. This is specially useful when testing code that uses a third party API but we do not want to be sending requests to the API endpoint all the time.

## Using this in a real test
In our small snippet of code we just answered the request, but didn't care about what happened to the response. In a real test we must check not only if the request was right, but also if the response was adequately processed. For that we will need to write *asynchronous tests*.

To make our test asynchronous we just need to include inside our suite (`describe` in Jasmine) a setup function (`beforeEach`) and call it's first argument whenever we are ready to start our specs (`it`). We will make the request and answer it within the setup function so that in our specs we can test the outcome of the entire process. It will look like this:

``` javascript
describe('myFunctionThatMakesRequests', function () {
  // Put our http response in a variable.
  var success = {
      status: 200,
      responseText: "Oh yeah!",
  }

  //Declare the variable within the suite's scope
  var request;
  beforeEach(function (done) {

    // Start listening to xhr requests
    jasmine.Ajax.install();

    //Call whatever will make the actual request
    myFunctionThatMakesRequests();

    //Answer the request.
    request = jasmine.Ajax.requests.mostRecent();
    request.respondWith(success);
    done();
  });

  it("sends the request to the right end point", function(done) {
    expect(request.url).toBe('http://localhost/test');
    done();
  });

  it("uses the correct method", function(done) {
    expect(request.method).toBe('GET');
    done();
  });

  it("sends the right data", function(done) {
    expect(request.data()).toEqual({id: '123456'});
    done();
  });
})
```

One interesting thing to note is the `request` variable was declared outside of the `beforeEach`, otherwise it would be outside of our specs' scope.

The same way we tested the request, we can test the handling of the response. Let's suppose `myFunctionThatMakesRequests` takes two arguments, a callback for when the request succeeds and one for when the request fails. We can then create a *spy* and make sure the right function is being called.

``` javascript
describe('myFunctionThatMakesRequests', function () {
  var responses = {
    success: {
      status: 200,
      responseText: "Oh yeah!",
    },
    failure: {
      status: 404,
      responseText: "Oh no",
    }
  };

  var request;

  //Create our spies
  onSuccess = jasmine.createSpy('onSuccess');
  onFailure = jasmine.createSpy('onFailure');

  beforeEach(function (done) {
    jasmine.Ajax.install();

    //Send our spy callbacks
    myFunctionThatMakesRequests(onSuccess, onFailure);

    //Answer the request.
    request = jasmine.Ajax.requests.mostRecent();
    done();
  });

  describe('on success', function () {
    beforeEach(function (done){
      request.respondWith(responses.success);
      done();
    });

    it("calls the onSuccess callback", function(done) {
      expect(onSuccess).toHaveBeenCalled();
      done();
    });
  })

  describe('on failure', function () {
    beforeEach(function (done){
      request.respondWith(responses.failure);
      done();
    });

    it("calls the onFailure callback", function(done) {
      expect(onFailure).toHaveBeenCalled();
      done();
    });
  })
})
```

That's it. Our first `beforeEach` function is being called before each of our child suites and, within the child suites, their `beforeEach` is being called before their specs.

 We only checked if the callbacks were called but you can also make sure that our spies are being called with the right arguments and many other things. Just give a look at the Jasmine [documentation](http://jasmine.github.io/edge/introduction.html) to see everything that is possible.

## Intercepting requests from the `fetch` function
Unfortunately, for now Jasmine Ajax only intercepts requests made by the `XMLHttpRequest` object. Therefore, it does not work with our shiny new and much better `fetch` function. If you don't know about the `fetch` function you should stop everything you are doing and right now read [this](https://davidwalsh.name/fetch) post from [David Walsh](https://twitter.com/davidwalshblog?lang=en-gb). However, we don't give up that quickly, do we?

What we will do is to use a [polyfill](https://remysharp.com/2010/10/08/what-is-a-polyfill) that recreates the `fetch` function with xhr. You can install Github's fetch polyfill in node with `npm install whatwg-fetch --save`. Polyfills, however, only use their code if the native implementation is not available. So, for our trick to work we have to get rid of the native fetch before running the polyfill.

The result will look like this:


``` javascript
window.fetch = undefined;
require('whatwg-fetch')
require('jasmine-ajax')

// Do tests
...
```

With Jasmine Ajax we can now save those precious server preparation or mock writing minutes and just prepare another coffee. ☕

---
**TL;DR**

- Capture and send custom responses to XHR requests with:

``` javascript
require('jasmine-ajax')
jasmine.Ajax.install();
//Call the request maker function
myFunctionThatMakesRequests();
//Give a custom answer to my function's request.
request = jasmine.Ajax.requests.mostRecent();
request.respondWith({ status: 200, responseText: "Oh yeah!" });
```

- Use a `fetch` polyfill that uses xhr to intercept requests from the fetch API like this:

``` javascript
window.fetch = undefined;
require('whatwg-fetch')
require('jasmine-ajax')
// Do tests
...
```
---
