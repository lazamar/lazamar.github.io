---
layout: post
title: Recursion Patterns - Getting rid of stack overflows
---

In functional programming languages you may find yourself overflowing the stack. This post describes techniques to achieve unbounded recursion without fear of the stack.

&nbsp;

---

## TL;DR

- The name of the game is *staying tail recursive*
- Enable tail recursion by passing down computed values
- Stick to one recursive call at a time by passing down a list of recursions to be done

---

&nbsp;

If we reach a stack overflow it is because we are not taking advantage of tail recursion. The fix is: use tail recursion. How to do that, however, is not always very clear. 

## Tail recursion

Quick recapitulation: If the very last thing our function does is to return the recursive call, it qualifies for [tail call optimisation](https://en.wikipedia.org/wiki/Tail_call). This optimisation makes the recursive call take the place of the invoking function in the stack, allowing us to recurse without growing the stack size. This eliminates the risk of a stack overflow.

This function is tail recursive:

``` haskell
-- Pauses execution for n loops of the runtime
sleep n = 
	if n > 0 then 
		sleep (n - 1) 
	else 
		n
```

This other function, however, is not. You can test that by passing it a big number, like `1000000000`. It will immediately throw a stack overflow error.

``` haskell
-- Just count from n to 0. Returns n.
count n = 
	if n > 0 then 
		count (n - 1) + 1
	else 
		n
```

**Don't be fooled by arithmetic operators**. They are functions like any other. `a + b` is the same as `sum a b`. Therefore the last function call in `count` is not the recursive call, but a call to `sum`, which depends on the result of the recursive call. This disqualifies `count` for tail call optimisation.

## Making functions tail recursive

### Accumulating parameter

If every recursive call is building directly on top of the previous call's work, you make that tail recursive by passing this accumulated computation forward with the recursion. This way you make sure that your last action is the recursive call. More about the accumulating parameter [here](https://wiki.haskell.org/Performance/Accumulating_parameter).

``` haskell
count n = count_ 0 n

count_ acc n = 
	if n > 0 then 
		-- Notice how now `count` is the last function we invoke 
		count_ (acc + 1) (n - 1)
	else 
		acc
```

If we want to reverse a list, for example, we can do it in a stack-safe way by using the accumulating parameter.

``` haskell
reverse list = reverse_ [] list

reverse_ acc list = 
	case list of
		[] -> acc
		head::tail -> reverse_ (head::acc) tail
```

Regardless of the size of the list being reversed, the depth of the stack is always 1.

## Generalising the accumulating parameter

Now for a trickier example. Imagine we have a binary tree and we want to insert a value at its rightmost position.

Here is the naive non-tail-recursive implementation.

```haskell
type Tree a
	= Node (Tree a) a (Tree a)
	| Empty

insertRightmost new tree =
	case tree of
		Node left value right -> 
			Node left value (insertRightmost new right)
		Empty -> 
			Node Empty new Empty

```

The recursive call builds directly on the parent, but it is hard to see how we can pass that node forward as its creation depends on the recursive result. The solution is to have the accumulating parameter hold the data to be put together, and process the accumulated data in the recursion's termination clause.

We end up having two cases:

- A recursive case where we shape the data in a digestible format, add it to the accumulating parameter and recurse
- A termination case where we process all the data we accumulated


Using this trick we can create a stack-safe version of `insertRightmost`.

```haskell
insertRightmost : a -> Tree a -> Tree a
insertRightmost value tree =
	insertRightmost_ [] value tree


insertRightmost_ : List (Tree a, a) -> a -> Tree a -> Tree a
insertRightmost_ acc new tree =
	case tree of
		Node left value right -> 
			insertRightmost_ ((left, value) :: acc) new right
		Empty -> 
			joinNodes acc (Node Empty new Empty)

joinNodes : List (Tree a, a) -> Tree a -> Tree a
joinNodes nodes right  =
	case nodes of 
		[] -> 	
			node
		((left, value) :: tail) -> 
			joinNodes tail (Node left value right)
```

### Multiple recursion calls

Sometimes we need to make more than one recursive call. The fibonacci function is a good example but you will most likely come across that in a [divide and conquer algorythm](https://en.wikipedia.org/wiki/Divide-and-conquer_algorithm).

Here is the naive stack-overflowing version. 

```haskell
fib n = 
	if n == 0 || n == 1 then
		n 
	else
		fib (n - 1) + fib (n - 2)
```

In cases like these we can keep two accumulators, one with things to do, and one with the work we completed. 

```haskell
fib n = fib_ [] 0 a

fib_ : List Int -> Int -> Int -> Int
fib_ todo done a =
  if a == 0 || a == 1 then 
      case todo of                               
          [] -> done + a
          head::tail -> fib tail (done + a) head
  else                                          
      fib (a - 1::todo) done (a - 2) 
```

Passing down a representation of computations to be done and a representation of completed computations is a very powerful concept. 
It is this idea that enables the creation of stack safe versions of many complicated algorithms.

We can even think of zipper lists and zipper trees as data structures that embody this concept.

You can fix your misbehaving function by passing down everything you calculate to the recursive call.

## Performance and stack safety

A performant and stack safe version usually combines the accumulating parameter and an insight specific to your function about what it is doing. Unfortunately there is no formula for that part.

In the case of fibonacci, the revealing insight is to realise that going up from *0* to *n* is a lot easier than going down from *n* to *0*. We pass two accumulators, one holding the outcome of `fib (next - 2)` and one holding the outcome of `fib (next - 1)`. 

``` haskell
fib n =
    if n == 0 || n == 1 then
        n
    else 
        fib_ 0 1 2 n
 
fib_ minusTwo minusOne next target =
    if next > target then
        minusOne
    else 
        fib_ minusOne (minusOne + minusTwo) (next + 1) target
```

Last but not least, don't compare on equal footing the performance of stack-safe and non-stack-safe versions of a function. Remember that one is reliable and the other isn't.
