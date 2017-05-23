---
layout: post
title: Calling Elm functions synchronously from JavaScript
---

As my Elm codebase grows, I start to see more and more places where it would be great to share some business logic between my front-end Elm and my back-end Node. This is how I got my Node code to call my Elm functions synchronously.


&nbsp;

---
### TL;DR

- Use a naughty *Native* module to turn your Elm functions into `Json.Decode.Value`s and send them through a port.
- Check [https://github.com/lazamar/elm-synchronous](https://github.com/lazamar/elm-synchronous) for an [sscce](http://sscce.org/) example.  

---


&nbsp;


**Warning**: This is a naughty hack that uses the purposely undocumented `Native` api to trick the Elm runtime and may not continue to work in the future.  Check [this](https://github.com/eeue56/take-home/wiki/Writing-your-first-impure-Elm-Native-module) and [this](https://github.com/eeue56/take-home/wiki/Writing-Native#should-i-be-writing-native) for the concequences of using Native modules.


&nbsp;


I could use ports for the Node-Elm connection but they are inconvenient here for two main reasons:

 - Ports are always asynchronous. The logic I want to implement is pure so synchronicity would make much more sense.


 - All responses go through the same hole. I would have to add some identifier as a parameter when calling my input port and look for that identifier in all responses from my output port.

So I set out to find a nicer way to get my Node.js JavaScript code to interact synchronously with some Elm module of mine.

## Existing solutions

After spending some time going through the work of all of those who came before me, I considered the two best methods to be [https://github.com/mbylstra/call-elm-functions-from-js-dont-do-this](https://github.com/mbylstra/call-elm-functions-from-js-dont-do-this) and [https://github.com/eeue56/take-home](https://github.com/eeue56/take-home). Both seem to have this line as their secret sauce:

``` haskell
Elm.worker(Elm.MyModule)
```

Apparently this creates an *Elm runtime* or something of the kind. Anyway. Lo and behold, this doesn't work anymore. Surprise motherfocker!


## A new hope

I remember it vividly. I was standing on the edge of my toilet hanging a clock, the porcelain was wet, I slipped, hit my head on the sink, and when I came to I had a revelation! A vision! A picture in my head! A picture of this! This is what makes synchronous Elm function invocation possible: The `Json.Decode.Value` type.

If we could pass our functions through a port our problems would be solved. We would just listen to that port once in our JS and when it gives us our Elm function we would store a reference to it and throw the port away! Now that we have a reference to the real function we can use it synchronously without ever needing to care for that port again! But life is not that easy and you can't pass functions through ports. It's illegal.

Here is the drill. You can pass anything to a function in a Native module. This means we can pass functions to them too. And when we return something from our Native module, if we say it is a `Json.Decode.Value` Elm won't try to check what's inside of it. This means we can now pass this `Json.Decode.Value` through our port without the runtime noticing! We have just created a small function laundry business!

Let's look at the code that will make this work. I decided to call my native module *Transformer*, so it will live under `Native/Transformer.js`. Remember to add `"native-modules": true` to your `elm-package.json` . Here it is


``` javascript
const _user$project$Native_Transformer = (function() {
    return {
        toJsFunction: fun => {
            // Elm functions are curried and take only one argument.
            // This means we would have to call them like this:
            //        sum(2)(3)
            // Here we create a little wrapper to let us call the like this:
            //        sum(2, 3)
            const arity = fun.arity;

            return (...args) => {
                return args
                    .slice(0, arity)
                    .reduce((result, argument) => result(argument), fun);
            };
        }
    };
})();
```


In my Elm code I created a typed wrapper for it and use it like this:


``` haskell
import Native.Transformer

-- The type is showing a function of arity 1, but toJsFunction accepts
-- functions of any arity
toJsFunction : (a -> b) -> Json.Decode.Value
toJsFunction =
    Native.Transformer.toJsFunction

-- Ordinary function
sum : Int -> Int -> Int
sum x y =
    x + y

-- Ready to go through a port
jsSum : Json.Decode.Value
jsSum = toJsFunction sum

```


## Getting it to work

You can see the full program at [https://github.com/lazamar/elm-synchronous](https://github.com/lazamar/elm-synchronous)

Here is what we will do. First we will create a module whose sole purpose is to expose our desired Elm functions. Our front-end Elm module probably does http requests, handles lots of Ui, state changes, etc. We don't need any of that overhead. We keep our functions in a module of their own so we can import them from the front-end and from the back-end.

```
      ┌───────> MyFunctions.elm <──────┐
FrontEnd.elm                      BackEnd.elm

```

 Our module for the back-end will have two ports:

 - One for our JS to listen to. This one will receive an object containing all the functions we want to expose.

 - One for our JS to call. Once we are listening on the other port, this will trigger Elm to call our listener function.


``` haskell
port expose : PublicAPI -> Cmd msg

port requestExposition : (Json.Decode.Value -> msg) -> Sub msg
```


That's it. We can now get our functions through these ports. Here is how we can use it in Node.


``` javascript
const jsdom = require("jsdom");

// Elm needs some DOM to operate on, so create a fake one.
// In the browser we don't need that
const dom = new jsdom.JSDOM();
global.window = dom.window;
global.document = dom.window.document;

// Here we are requiring the compiled Elm code directly. Nothing fancy
const Elm = require("./elm-build/main");

// This is just a little Promise-like wrapper.
// We could just use callbacks instead if we wanted.
const { Future } = require("ramda-fantasy");

// This will load the API we are exposing. Ideally we only
// call this once and afterwards use a reference to the
// object it returned.
const loadAPI = () =>
    Future((reject, resolve) => {
        const app = Elm.Main.fullscreen();
        app.ports.expose.subscribe(api => {
            resolve(api);
        });
        app.ports.requestExposition.send();
    });

loadAPI()
    .map(api => {
        console.log("Greeting");
        console.log(api.greet("Marcelo")); // "Hello Marcelo"

        console.log("Summing numbers");
        console.log("2 + 3 = ", api.sum(2, 3)); // "2 + 3 = 5"

        console.log("Triple OR operation");
        console.log("OR true false false = ", api.tripleOr(true, false, false)); // true
    })
    .fork(err => console.log("Error:", err), () => console.log("Success"));
```

## Some considerations

This method is not all that hacky. The only non-standard feature required was the Native API and it is widely used by the community, so it's unlikely that it will stop being supported. It will obviously not work when Elm starts compiling to machine code or Web Assembly or something else.

Just like ports, you have to be careful with the values you have going in and out from these functions. Elm will not check their types at invocation time, so you can break you program if you pass something unexpected to it, just like pure JavaScript. The recommended way to handle that is to use encoders and decoders for these functions. Create a wrapper around them to decode any value sent from JavaScript and encode it back to a JavaScript value before it returns. Because decoding can fail, your functions will have to return something like a `Result` or `Maybe` type. You can use a monad library like [ramda-fantasy](https://github.com/ramda/ramda-fantasy) (my fave) to wrap these values in JavaScript.

If you try this and find some pitfalls, be it with the Elm runtime in Node or with deceiving values make sure to mention so I can add it to the post.
