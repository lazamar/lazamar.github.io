---
layout: post
title: Roadmap to learning Haskell
---

I set out to learn Haskell and it hasn't been all roses. So, in an attempt to make life easier for those who come after me I will document my journey here and what has worked for me. I had to skim read many posts that didn't address my needs, but here I am documenting only what was really useful, so you shouldn't skim read this stuff. These are the posts you actually have to stop and read.

For context, this is the journey of a JavaScript developer learning to build a Haskell web server.

## First, some ELM

For a starter, what attracted me to all of this was functional programming in JavaScript and then in [ELM](http://elm-lang.org/). If you are a front-end dev and want to get into functional programming you must look into ELM.

ELM is a functional programming language that compiles to JavaScript. It shows you how to create programs that are entirely [pure](https://medium.com/javascript-scene/master-the-javascript-interview-what-is-a-pure-function-d1c076bec976) and that have no run-time errors. This is what really caught me. In ELM, if your program compiles, it works. There is no other language out there (not even Haskell) with this guarantee. But with some simple practices taken from ELM you can get very close to no-runtime errors in Haskell.

For those reasons I highly recommend that you learn ELM at some point. It will also make your front-end development a dream, instead of this tar pit that consumes your days one bug at a time.


## Now to the good stuff

### How to read Haskell

First I read the whole of [Learn you a Haskell for Great Good](http://learnyouahaskell.com/). It's not too long, it's funny and you can read online for free. It took me a bit over one week (because I already knew ELM. If you are new to Functional Programming it will take you more time. Don't worry, it's not a competition!!)

You kind of need to read it because Haskell people use a very unique cryptic vocabulary that is unnecessarily over complicated. This book distills the meaning of the main words used by these individuals.

Here are some of the absolutely-must-know things it covers:
- **Hindley-Milner** type system
- **Monads**
- **Purity** and **Effects**
- Common operations like **>>=**, **>>**, **$**, **.** and **++**
- Common monads (**IO**, **Maybe**, **Either**)
- **Evaluation order**
- **Type classes**
- **Kinds** *(not really relevant but makes you sound really smart)*

Now you can write some cool programs that save stuff to files and print to the terminal. That's actually knowledge enough to build a compiler, one of Haskell's popular uses, but not much more than that.

### Managing packages

At this point my next question was **how do I make HTTP requests?**, and the answer was not very straight forward.

You have to use a package that is not in the standard library, which brings us to the question **How do I install a Haskell package?**. Haskell's version of NPM is called `Cabal` and it has it's [quirks](http://www.drmaciver.com/2015/04/the-1-reason-i-dont-write-haskell/). But [Stack](https://docs.haskellstack.org/en/stable/README/) is a tool that packs everything we need and help us with avoiding the some of Cabal's pitfalls. Read Stack's *Quick Start* and half of the *User Guide* and you will be ready to go. Over there, don't forget to look into the useful `runghc` command.

### How to make HTTP requests

Now we are getting closer to the good stuff. Read [Making HTTP requests - http-client library](https://haskell-lang.org/library/http-client) and the alchemy of internetting will be imparted unto you.

At this point I found it useful to build a simple script that takes a url as a command line argument, downloads the url content and saves it in a file. Building stuff is the only way to see where your knowledge gaps are, so do it.


---
**TL;DR**


---
