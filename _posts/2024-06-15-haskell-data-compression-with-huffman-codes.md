---
layout: post
title: Building a data compression utility in Haskell using Huffman codes
city: Póvoa de Varzim, Portugal 🇵🇹
---


<img style="
        margin-top: -12%;
        margin-bottom: -9%;"
    src="/images/data-compressor.svg"
    alt="Data compression illustration"
    title="Illustration from https://www.transhumans.xyz/"
/>


<script src="/assets/data-compressor/smvc.js"></script>
<script src="/assets/data-compressor/script.js"></script>

In this post we will implement a data compression program in about 150 lines of Haskell.
It will use [Huffman coding](https://en.wikipedia.org/wiki/Huffman_coding) and handle arbitrary binary files using constant memory for encoding and decoding.

The plan is:
1. We briefly cover what Huffman codes are and how they can be used for data compression.
2. We write a coder capable of compressing text.
3. In the last step we use this coder to compress any file at all.

We will leverage laziness to keep our memory footprint constant while the code remains modular. A good example of [Why Functional Programming Matters](https://www.cs.kent.ac.uk/people/staff/dat/miranda/whyfp90.pdf).

The full code is available [here](https://github.com/lazamar/compressor).

## Crash course on Huffman codes

The idea is straightforward:
Map each character to a unique sequence of bits.
Choose the bit sequences such that common characters map to shorter bit sequences and rare characters map to longer ones.
Compression is achieved by the most common characters using fewer bits than their uncompressed representation.

I say characters here, but we could really map anything to bits; like whole words or even bit patterns themselves. But let's not worry about that for now and stick with characters for the time being.

Let's say we have the string `aaab` and we want to compress it using Huffman codes.
Well, we know there are only two characters in our input so a single bit should be enough to differentiate which one is which at each position. Here is a possible mapping:

<div class="pre-table-striped"></div>

| Character | Code word |
|-----------|-----------|
| a         | `1`       |
| b         | `0`       |

So our Huffman encoded binary result would be:

```
1110
```

A decoder knowing the mapping used for encoding can unambiguously retrieve the original text.

The result wasn't bad either. We encoded in half a byte something that in UTF-8 would have taken 4 bytes.

### Prefix-free codes

Now say the input is `aaabc`.
A single bit won't suffice but given `a` appears most often we will choose it to have the smallest code word.
Something like this will work.

<div class="pre-table-striped"></div>

| Character | Code word  |
|-----------|------------|
| a         | `1`        |
| b         | `00`       |
| c         | `01`       |

Resulting in the binary

```
1110001
```

Our decoder can again unambiguously decode the result.
But you may have noticed that we couldn't choose just any code word for `b` and `c`.

If `b`'s code word were `10` instead of `00` decoding results would become ambiguous!
What should `101` decode to? `ac` or `ba`?

To make it unambiguous we must make sure that no code word is a prefix of another code word.
It's termed a prefix-free code.


### Creating prefix-free codes

There is an easy technique for creating as many prefix-free codes as we may want.

1. Put all your characters as leaves of a complete binary tree.
2. Label all edges, using `1` for left branches and `0` for the right ones.
3. The path from the root describes each character's code word.

Look at the complete binary tree below.
Starting from the root we can reach any leaf.


<img
    src="/assets/data-compressor/binary-tree.svg"
    height="300px"
    style="margin: auto; display:block"
/>

Which describes this mapping:

<div class="pre-table-striped"></div>

| Character | Code word  |
|-----------|------------|
| A         | `1`        |
| B         | `01`       |
| C         | `0011`     |
| D         | `0110`     |
| E         | `000`      |

Now, we don't want to use just any complete binary tree.
We want characters that appear more frequently to be closer to the root.
This will give them shorter code words.

So let's do this: we start creating the tree from the bottom.
We start with the least frequent characters, grouping the ones with the lowest amount of occurrences into small trees.
Then we combine them together, leaving the most frequently occurring characters to be added to the tree last.

The algorithm is:

1. Annotate each character with its number of occurrences (weight). Each one will become a weighted node.
2. Group into a tree the nodes with the smallest weights. This tree is now become a single weighted node, where the weight is the sum of the two grouped nodes.
3. Repeat step 2 till we have a single tree.

Here is how this process would go for the string `aaabc`:

<img
    src="/assets/data-compressor/evolution.svg"
    width="400px"
    style="display:block"
/>


Now you know Huffman codes! You've seen what they are, how they achieve compression, and how to implement them.

### Playground

You can change the text in the box below and see how well it compresses, what different code words you get, and what the binary result looks like.
Hover the encoded content to see what character it represents.

<style>
.huffman-visualisation {
    border: 2px solid black;
    padding: 1em;
}

.h-content {
    word-wrap: break-word;
    text-wrap: wrap;
    padding: 1em;
    background-color: #eee;
}

.h-encoded {
    font-family: monospace;

    max-height: 20em;
    overflow-y: auto;
    overflow-x: hidden;
}

.h-encoded span:nth-child(odd) {
    background-color: #dadada;
}

.highlighted {
    background-color: #f05f70 !important;
}

.h-code {
    position: relative;
    cursor: pointer;
}

.h-code-label,
.h-code-char {
    background-color: bisque;
    padding: .2em 1em;
    border: 1px solid black;
    pointer-events: none;
}

.h-code-label {
    display: none;
    position: fixed;
    top: var(--mouse-y);
    left: var(--mouse-x);
}

.h-code-char {
    position: absolute;
    top: calc(-100% - 1em);
    left: 0;
    visibility: hidden;
}

.h-code:hover .h-code-char {
    visibility: visible;
}


.h-encoded:hover .h-code-label {
    display: block;
}

.pre-table-striped + table code {
    background-color: transparent;
}

</style>

<script>
document.addEventListener('mousemove', evt => {
    let x = evt.clientX;
    let y = evt.clientY;

    document.body.style.setProperty('--mouse-x', `${x}px`);
    document.body.style.setProperty('--mouse-y', `${y}px`);
});
</script>



<div class="huffman-visualisation"></div>
<script>
    initHuffmanVisualisation(document.querySelector(".huffman-visualisation"))
</script>

## Writing the coder.

Ok, so now that we know how it goes, writing the coder is pretty trivial.

First, let's lay out the types we'll need.

``` haskell
-- import Data.Map.Strict (Map)

data Bit = One | Zero
  deriving Show

-- A code word
type Code = [Bit]

-- How often each character appears
type FreqMap = Map Char Int

-- Find a character's code word
type CodeMap = Map Char Code

-- How often all characters in a tree appear
type Weight = Int

-- Our complete binary tree with the weight for each subtree
data HTree
  = Leaf Weight Char
  | Fork Weight HTree HTree
  deriving Eq

-- Making trees comparable by weight will simplify the tree building.
instance Ord HTree where
  compare x y = compare (weight x) (weight y)

weight :: HTree -> Int
weight htree = case htree of
  Leaf w _ -> w
  Fork w _ _ -> w
```

The encoder is just a function that given a string, outputs some bits.
But with just the bits the decoder can't retrieve the original text. It needs to know the mapping used.

The mapping can be build from the `FreqMap` so let's pass that whenever we are encoding or decoding.

So we want to write the two functions:

``` haskell
encode :: FreqMap -> String -> [Bit]

decode :: FreqMap -> [Bit] -> String
```

### Encode

Let's start by building the `FreqMap`,

``` haskell
countFrequency :: String -> FreqMap
countFrequency = Map.fromListWith (+) . fmap (,1)
```

Easy enough. As seen before, we can build our Huffman tree from that. So let's do it.

``` haskell
-- import Data.List (sort, insert)
-- import qualified Data.Map.Strict as Map

buildTree :: FreqMap -> HTree
buildTree = build . sort . fmap (\(c,w) -> Leaf w c) . Map.toList
  where
  build trees = case trees of
    [] -> error "empty trees"
    [x] -> x
    (x:y:rest) -> build $ insert (merge x y) rest

  merge x y = Fork (weight x + weight y) x y
```

Here is where that `Ord` instance we defined came in handy. We make all characters into weighted `Leaf`s.
Then we sort them, getting the least frequent ones to the front.
After that we repeatedly merge the front elements of the sorted list and insert the merged output back again.
The `insert` function does an insert-sorted here, keeping our invariant of least frequent at the front.

With the Huffman tree in place we can just create the codes!

``` haskell
buildCodes :: HTree -> CodeMap
buildCodes = Map.fromList . go []
  where
  go :: Code -> HTree -> [(Char, Code)]
  go prefix tree = case tree of
    Leaf _ char -> [(char, reverse prefix)]
    Fork _ left right ->
      go (One : prefix) left ++
      go (Zero : prefix) right

```

With that we have all the parts to write `encode`!

``` haskell
encode :: FreqMap -> String -> [Bit]
encode freqMap str = encoded
  where
  codemap = buildCodes $ buildTree freqMap
  encoded = concatMap codeFor str
  codeFor char = codemap Map.! char
```

> **A note on laziness**.
>
> The step that transforms the original input into a list of bits is `concatMap codeFor str`.
Conceptually, the transformation is: `[Char]` to `[[Bit]]` to `[Bit]`.
If it happened this way it would be a big problem given we'd need to encode the entire input first to only then concatenate all the results.
Our RAM would need to be at least as large as twice our input.
In reality, the small sublists are flattened into the large result from left to right as we go.
>
> This is no mundane feat! Remember, the result is an immutable linked-list.
How can we proceed from left to right, creating the head of the list before the tail without ever modifying any of its nodes?
That's the beauty of it. The tail is an unevaluated thunk which only gets calculated after we ask for its value.

### Decode

With that in place, we can decode the bits back into the original string.

``` haskell
decode :: FreqMap -> [Bit] -> String
decode freqMap bits = go 1 htree bits
  where
  htree = buildTree freqMap
  total = weight htree -- how many characters were encoded.
  go count tree xs = case (tree, xs) of
    (Leaf _ char, rest)
      | count == total -> [char]
      | otherwise -> char : go (count + 1) htree rest
    (Fork _ left _ , One  : rest) -> go count left rest
    (Fork _ _ right, Zero : rest) -> go count right rest
    (Fork{}, []) -> error "bad decoding"
```

`go` will go through the tree from the root, using the bits in the input to decide whether to go
left or right at each internal tree node.
When we reach a leaf node we add the character to the output and start again from the root.

We do that till we have decoded all the characters.

We use the `total` number of characters to know when to stop rather than the end of the input list of bits because,
as we will see, on the serialisation section we will add some padding at the end for alignment at the byte mark.

Notice how `go` function, upon reaching a `Leaf`, returns a list where the head is known and the tail is a recursive call.
This makes this function **productive**. It means that its result can start to be evaluated before the entire recursion is complete.

Like it was with `concatMap` during encoding, this design will allow us to process a large input *incrementally*.
And with the right setup we can use this to run our program in *constant memory*. And that's the next step.

With these pieces we can already encode and decode text using Huffman codes. Let's try it out in `ghci`.

``` bash
$ gchi Main.hs
ghci> input = "Hello World"
ghci> freq = countFrequency input
ghci> bits = encode freq input
ghci> bits
[Zero,Zero,One,Zero,One,One,One,Zero,One,Zero,One,Zero,Zero,Zero,Zero,Zero,One,One,One,Zero,One,Zero,Zero,Zero,One,One,Zero,Zero,One,One,Zero,Zero]
ghci> decode freq bits
"Hello World"
```
