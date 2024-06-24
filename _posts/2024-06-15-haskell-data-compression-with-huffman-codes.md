---
layout: post
title: Building a data compression utility in Haskell using Huffman codes
city: Póvoa de Varzim, Portugal 🇵🇹
---

<script src="/assets/data-compressor/smvc.js"></script>
<script src="/assets/data-compressor/script.js"></script>

In this post we will implement a data compression program in about 150 lines of Haskell.
It will use [Huffman coding](https://en.wikipedia.org/wiki/Huffman_coding) and handle arbitrary binary files using constant memory for encoding and decoding.

The plan is:
1. We briefly cover what Huffman codes are and how they can be used for data compression.
2. We write a coder capable of compressing text.
3. In the last step we use this coder to compress any file at all.

We will leverage laziness to keep our memory footprint constant while the code remains modular. A good example of [Why Functional Programming Matters](https://www.cs.kent.ac.uk/people/staff/dat/miranda/whyfp90.pdf).

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


You now know Huffman codes! You've seen what they are, how they achieve compression and how to implement them.

### Playground

You can play with it in the box below.
You can change the text and see how well it compresses and what different code words you get and what the binary result looks like.
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
