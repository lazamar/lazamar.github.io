---
layout: post
title: Writing Better If Statements
---

We all know how important code comments are, but we all aim for that marvelous holy grail of coding: the self documenting code. That is, code that does not need comments, you can read it like a book.

I when I read [Code Complete 2](https://www.amazon.co.uk/Code-Complete-Practical-Handbook-Construction/dp/0735619670) I had something around an order of magnitude improvement in my coding. One of the things that struck me was how much better my `if` and `while` statements became.

It is common to see something like this:

``` javascript
if (score >= 7) {
  showMessage('You won!');
}
```

Well, that's not very bad. It is actually quite short and the context gives us a clear hint of what is going on. This condition could be left as it is. However, we can improve it a little bit by moving that 7 into a variable.

``` javascript
const minimumWiningScore = 7;
if (score >= minimumWiningScore) {
  showMessage('You won!');
}
```

We did add an extra line of code and an extra variable, but the readability improvement outweighs these cons.
That was not very impressive, but out in the wild we very often see things like this one:

``` javascript
if ((el.boundingBox.top <= click.y &&
      el.boundingBox.bottom >= click.y) ||
      (el.boundingBox.right >= click.x &&
      el.boundingBox.left <= click.x)) {
      blinkRed();
    }
```

This is a quite long and confusing condition, it would probably be quicker to read a comment about what it is doing than to try to check it out ourselves. Here is where we have the greatest refactoring improvement. We immediately make our code more reliable if we **store our logical conditions in a variable that explains its purpose**. Look:

``` javascript
const clickWithnElXRange = el.boundingBox.left <= click.x && click.x <= el.boundingBox.right;
const clickWithnElYRange = el.boundingBox.top <= click.y && click.y <= el.boundingBox.left;
const clickWithinElement = clickWithnElXRange && clickWithnElYRange;
if (clickWithinElement) {
  blinkRed();
}
```

Oh, how beautiful. Now we can understand exactly what is going on without having to think too hard at it. We can spend our hard thinking with more higher level things. You will aldo notice that I rearranged the factors; having them in order from smallest to largest also improves readability.

Containing logical operations in a variable is a good idea not only for long comparisons, but even to making the meaning of a single operation clearer.

``` javascript
const verySad = happinessCoefficient < 2;
if (verySat) {
  //...
}
```

There you go, that's it. It might seem that it is actually more laborious and long to write these variables than to write the condition directly. This might be true, but whatever extra time you spend writing those down will be more than saved at debugging and code-reading time.
