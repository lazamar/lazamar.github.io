---
layout: post
title: Building a data compression utility in Haskell using Huffman codes
city: Póvoa de Varzim, Portugal 🇵🇹
---


<img style="
    margin: -12% auto -9% auto;
    width: 80%;
    display: block;"
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

## Using the coder with binary files

We can encode text input. That's all well and good but how do we go from that to encoding binary data?

First we notice that the keys of our frequency map represent all the different things we may want to encode, each with a different frequency.
They are characters but they could have been something else.

Then we notice that particular byte is nothing more than one out of 256 possible bytes.
So, to encode binary data we just need a frequency map of of bytes (`Word8`) rather than of characters.

But our lives can be even easier. We can use the [`Data.ByteString.Char8`](https://hackage.haskell.org/package/bytestring-0.12.1.0/docs/Data-ByteString-Char8.html) module to read bytes as `Char`s!
The module allows us to

> Manipulate `ByteStrings` using `Char` operations.
> All Chars will be truncated to 8 bits.
> It can be expected that these functions will run at identical speeds to their `Word8` equivalents in `Data.ByteString`.

This means we can use our text coder to encode binary data. We don't need to change any of the code.

### Serialising

We start by converting the output into actual bytes which we can save in a real binary file.

But notice that a decoder can't just decode a stream of zeroes and ones without any context.
It will need the frequency map to do that.
So our compressed output will start with the frequency map, followed by the encoded content.

We want this function

``` haskell
serialize :: FreqMap -> [Bit] -> ByteString
```

To build the `ByteString` lazily and efficiently we will use the `Put` monad from the `binary` package.

``` haskell
-- import Data.Binary.Put (Put)
-- import qualified Data.Binary.Put as Put
-- import Data.ByteString.Internal (c2w, w2c)

serializeFreqMap :: FreqMap -> Put
serializeFreqMap freqMap = do
  Put.putWord8 $ fromIntegral (Map.size freqMap) - 1
  forM_ (Map.toList freqMap) $ \(char, freq) -> do
    Put.putWord8 (c2w char)
    Put.putInt64be $ fromIntegral freq
```

Here we encode first the length of the map as a `Word8`.
We have to subtract one because the `Word8` range is [0..256) whilst we need to represent the range (0..256].
We will add one when decoding to compensate.

Then we encode each map entry as a `Word8` for the key followed by a 64 bit integer for the value.

With that we can write the complete serialisation code.

``` haskell
-- import Data.Word (Word8)
-- import Control.Monad (replicateM, forM_, unless)

serialize :: FreqMap -> [Bit] -> ByteString
serialize freqmap bits = Put.runPut $ do
  serializeFreqMap freqmap
  write False 0 0 bits
  where
  write
    :: Bool   -- ^ are we writing the end marker
    -> Int    -- ^ bits filled in current byte
    -> Word8  -- ^ byte being filled
    -> [Bit]  -- ^ remaining bits
    -> Put
  write end n w bs
    | n == 8 = do
      Put.putWord8 w
      unless end $ write end 0 0 bs
    | otherwise =
      case bs of
        (One : rest) -> write end (n + 1) (w * 2 + 1) rest
        (Zero : rest) -> write end (n + 1) (w * 2) rest
        [] -> write True n w $ replicate (8 - n) Zero -- pad with zeroes
```

In `write` we build one byte at a time, starting with the rightmost bit of the byte.
The multiplication by 2 shifts the bits to the left, allowing space for the next bit to be added.

Once we've gone through 8 bits we write the byte and start again.

In the last byte we pad all remaining bits with zero.

### Deserialising

Now let's read what we encoded.

For the frequency map we will use the dual of `Put` from `Data.Binary.Get`. It's simple enough, just the inverse of what we did before.

``` haskell
-- import Data.Binary.Get (Get)
-- import qualified Data.Binary.Get as Get

deserializeFreqMap :: Get FreqMap
deserializeFreqMap = do
  n <- Get.getWord8
  let len = fromIntegral n + 1
  entries <- replicateM len $ do
    char <- Get.getWord8
    freq <- Get.getInt64be
    return (w2c char, fromIntegral freq)
  return $ Map.fromList entries
```

With that in our pocket let's deserialise the whole thing.
Let's keep in mind that the `ByteString` here is a lazy `ByteString` produced by reading an input file.

``` haskell
-- import Data.ByteString.Lazy.Char8 (ByteString)
-- import qualified Data.ByteString.Lazy.Char8 as BS

deserialize :: ByteString -> (FreqMap, [Bit])
deserialize bs = (freqMap, bits)
  where
  (freqMap, offset) = flip Get.runGet bs $ do
    m <- deserializeFreqMap
    o <- fromIntegral <$> Get.bytesRead
    return (m, o)

  bits = concatMap toBits chars

  chars = drop offset $ BS.unpack bs

  toBits :: Char -> [Bit]
  toBits char = getBit 0 (c2w char)

  getBit :: Int -> Word8 -> [Bit]
  getBit n word =
    if n == 8
      then []
      else bit : getBit (n + 1) (word * 2)
    where
      -- Test the leftmost bit. The byte 10000000 is the number 128.
      -- Anything less than 128 has a zero on the leftmost bit.
      bit = if word < 128 then Zero else One
```

Notice how for the rest of the input we don't use `Get`.
The reason for this is that we want `deserialize` to return a `[Bit]` which is lazily built.

That is, we want it to return the `[Bit]` immediately, but this list is in reality just an unevaluated [thunk](https://wiki.haskell.org/Thunk).
This has some interesting consequences. We shouldn't, for example, ask to see the length of this list.
If we did that the entire list would have to be evaluated before giving us this information.

If we used `Get` for the entire input, we'd have a bunch of `getWord8` calls linked together via monadic bind (`>>=`).
Monads encode sequencing, so returning the list would be the last action to be performed, requiring the entire input to be processed before returning.

Our strategy for constant memory usage is that whenever we want get some output bits to write we will process the next portion of the `[Bit]`,
this will cause a small section of the `ByteString` to be evaluated, which will cause the respective part of the input file to be read.
We will then write this processed content into the output file.
Because we won't use the `[Bit]` or `ByteString` in other parts of the program, the garbage collector will be able to free the memory we just allocated for
that portion of input that we decoded.
This process is repeated until we reach the end of our input. We read little bit, write a little bit, free the memory we used. Thus achieving a constant memory overhead.

But isn't the memory required proportional to the size of the `FreqMap`? Yes, but if we are encoding bytes `FreqMap` can have at most 256 entries, thus a constant overhead.

## Everything together now

We can encode and decode stuff as well as put and extract that from byte strings. Let's apply it to real files.

``` haskell
compress :: FilePath -> FilePath -> IO ()
compress src dst = do
  freqMap <- countFrequency . BS.unpack <$> BS.readFile src
  content <- BS.unpack <$> BS.readFile src
  let bits = encode freqMap content
  BS.writeFile dst (serialize freqMap bits)
  putStrLn "Done."

decompress :: FilePath -> FilePath -> IO ()
decompress src dst = do
  bs <- BS.readFile src
  let (freqMap, bits) = deserialize bs
      str = decode freqMap bits
  BS.writeFile dst (BS.pack str)
  putStrLn "Done."
```

Notice how on `compress` we read the file twice.
The reason for this is that we need one full pass over the file to build the frequency map and another one to encode the data using this frequency map.
If we read the file only once, we would hold a reference to it after the frequency map was built, so that we could pass that reference to `encode`.
This would require us to hold the entire input file in memory!

By reading the file twice we can free the memory as we go both when building the frequency map as well as when encoding.

Decompression is pretty straightforward.

Now we just wrap it in a simple CLI interface and we are done.

``` haskell
-- import System.Environment (getArgs)

main :: IO ()
main = do
  args <- getArgs
  case args of
    ["compress", src, dst] -> compress src dst
    ["decompress", src, dst] -> decompress src dst
    _ -> error $ unlines
      [ "Invalid arguments. Expected one of:"
      , "   compress FILE FILE"
      , "   decompress FILE FILE"
      ]
```

Because we are only using packages that already come with GHC we don't even need cabal an can compile our code directly.

``` bash
$ ghc -O2 Main.hs -o main
```

Let's try it out with a text file. We will use Tolstoy's [War and Peace](https://www.gutenberg.org/ebooks/2600).
``` haskell
# compress
$ ./main compress WarAndPeace.txt WarAndPeace.txt.compressed
Done.

# decompress
$ ./main decompress WarAndPeace.txt.compressed WarAndPeace.txt.expanded
Done.

# check that it worked
$ diff -s WarAndPeace.txt WarAndPeace.txt.expanded
Files WarAndPeace.txt and WarAndPeace.txt.expanded are identical

# Result. 40% decrease in size.
$ du -h WarAndPeace*
3.2M    WarAndPeace.txt
1.9M    WarAndPeace.txt.compressed
3.2M    WarAndPeace.txt.expanded
```
Now with a binary file. And something a bit bigger.

``` haskell
$ time ./main compress ghcup ghcup.compressed
Done.

real    0m15.173s
user    0m15.035s
sys     0m0.077s

$ time ./main decompress ghcup.compressed ghcup.decompressed
Done.

real    0m14.555s
user    0m14.402s
sys     0m0.098s

$ ls -lah ghcup* | awk '{ print $5 "\t" $9 }'
106M    ghcup
84M     ghcup.compressed
106M    ghcup.decompressed
```
Using `+RTS -s` we can see that the maximum resident set size was less than 300KB
for handling `ghcup` and both processes used less than 10MB of memory to run.

Check the [profile](https://gist.github.com/lazamar/dac00ad2d90b2b92b3904ee432f0c62c) to see where time is being spent.

## Improvements

The goal for this tool was to have an implementation that was as simple and clear as possible.
There are plenty of ways we can make it more efficient at the cost of a bit more complexity.

Here are a few that you could give a go at implementing yourself:
* *Multithreading* - Decode sections of the file in parallel. Because you can't infer where code word boundaries are in a random location of the file,
    you can add a table at the beginning of the compressed file specifying section boundaries and their expected decoded size so that you can handle them in parallel.
* *Single-pass encoding* - This would require building the frequency map as you go. Also has the benefit of not requiring you to include it at the beginning of the file.
    You start with a freq map where every byte has an equal frequency value of 1, then every time you see a byte you encode it first and then update the freq map.
    The decoder will do the same, decode a byte then update the frequency map. This way the encode and decoder can still understand each other.
* *Canonical Huffman codes* - Instead of navigating the tree for decoding  in `O(log n)`, we can use the code to index directly into a vector in `O(1)`. It's worth checking the [wiki](https://en.wikipedia.org/wiki/Canonical_Huffman_code) for it.
* *Faster code creation* - If you try single-pass encoding you will need to make the `CodeMap` creation much faster. The faster ways to create the code words can do it without building a tree the way we did in this post.

And that's it. A usable data compression utility in Haskell.

In the future I may write about using an adaptive dictionary scheme like LZ77. With Huffman codes and LZ77 we can implement gzip.

---

You can discuss this post [here](https://www.reddit.com/r/haskell/comments/1duc64e/building_a_data_compression_utility_in_haskell/).
