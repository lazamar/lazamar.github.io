---
layout: post
title: Fast parsing of String Sets in Elm
city: London, UK 🇬🇧
---

Imagine you want to write a parser to match any of a set of strings that you know beforehand.

In Elm's standard parsing library you would use `Parser.oneOf`. Like this:

```elm
import Parser exposing (Parser, oneOf, backtrackable, token, getChompedString)

friendName : Parser String
friendName =
	oneOf
		[ backtrackable <| token "joe"
		, backtrackable <| token "joey"
		, backtrackable <| token "john"
		]
		|> getChompedString
```

Now we can parse the name of our friends. However this parser has a few problems:

### It is inefficient

If the string we are matching against is `"lisa"`, for example, this parser will perform the following steps:

- Look at the first three characters in our parsed string and check whether they are equal to `"joe"`. They aren't.
- Look at the first four characters in our parsed string and check whether they are equal to `"joey"`. They aren't
- Look at the first four characters in our parsed string and check whether they are equal to `"john"`. They aren't
- Fail

Oohf, that's not very good. From the first time we looked at this string we saw that no match would come out of it, but
this parser has to try every single alternative before it can see that.

### It is slow

Trying all of these alternatives is not free. In fact, the first three letters of this string were consumed by the parser three times.
We are going through the same characters over and over again.

For this reason using `oneOf` with `backtrackable` is [advised against](https://github.com/elm/parser/blob/master/semantics.md#backtrackable--oneof-inefficient) in the documentation.

It also means that the time it takes for parser to run increases linearly with the number of alternatives it has. If parsing 100 names takes *X*, parsing 200 names takes *2\*X*.

It will always try all possible options until it matches one, regardless of how the parsed string looks like.

### Order matters

Small as it is, our example has a bug. It will never be able to parse *joey* as *joe* will always succeed first. Once anything succeeds our parser stops.

## Creating a solution

### Efficiency

We want a solution that will go only once through the parsed string, and which will only check against matches that are close to the string being matched.
We don't want to be checking *joe*, *joey* and *john* against *lisa*.

To do that we could group our matches by starting word. This way we can check whether the target string starts with the same word as any of our possible matches and only check those.

```elm

matches =
    [   ( "j"
        , ["oe", "oey", "ohn"]
        )
    ]
```

This works very well. When we see `"lisa"` we notice that we have no match starting with `l` and immediately fail. Much faster.

However, if we match against `"joanna"` our performance is not much better. We see that we have matches with *j* and try all of them just like before.
Nonetheless it is still somewhat better than the first version because if we did have matches starting with other letters we wouldn't try to match those.

To improve the situation we could try to apply this trick again, but this time considering the second word instead of the first.

```elm
matches =
    [   ( "j"
        , [   ( "o"
              , ["e", "ey", "hn"]
              )
          ]
        )
    ]
```

If we apply this technique over and over again we end up with a tree data structure called a **prefix tree**, also known as a [Trie](https://en.wikipedia.org/wiki/Trie).

The data is now organised like this:

                "j"
                  \
                  "o"
                 /  \
         (joe) "e"   "h"
               /       \
      (joey) "y"        "n" (john)


We can now check the target string character by character, and each time we consume a character we go down one level in the tree,
discarding all other branches with matches that don't have much to do with the string we are parsing.

We consume the string only once, and match it against multiple options at a time.

### Order

Our parsing finishes when either the tree ends, the string ends or the string describes a path that doesn't exist in the tree.
In any of these cases we will either succeed or fail depending on whether there was any successful matches in the path we passed through the tree.

Imagine we are matching against the string `"joeyel"`. We will go through *j-o-e-y* and then the tree is over. In this path we passed by two valid matches, `"joe"` and `"joey"`.
We can just succeed the latest one and we will effectively be picking the longest possible match. This means that option order is not a source of bugs in our parser anymore.

### Performance

Once we get past *j* and *o* we can match either *e* or *h*. We could try them in sequence. Two comparisons is not bad.
But if we have hundreds, or even thousands of options this is not a good idea. It would be much better to do a binary search on the available options.
This would perform at most the logarithm of the number of options. So if you have 50 possibilities it would perform at most 6 checks.

Elm Dictionaries perform binary search when looking for a key, so we can store our next options there.

In the end the Trie type looks like this:

```elm
type Trie a
    = Trie (Node a)


type Node a
    = Node (Maybe a) (Dict Char (Node a))
```

## How fast is our approach?

Let's imagine that we are trying to match a word with 5 characters and we have 1000 words in our dictionary.

The time complexity of `oneOf` + `backtrackable` + `token` is of **O(n * l)**, where *l* is the length
of the word being matched and *n* is the total number of words.
In the worst case scenario our example would require 5000 comparisons with this approach.

The time complexity of using a Trie and matching the possible characters sequentially at each level is of **O(n + l)**.
In the worst case scenario our example would require 1005 comparisons with this approach.

The time complexity of our final *Trie* + *Dict* approach is of **O(l * log2(n / l))**.
In the worst case scenario our example would require 39 comparisons with this approach.

![dict-parser-comparison](../images/2020-03-10-comparisons-chart.svg)

### Benchmarks

When benchmarked, the real speedup ranges between 3 and 60 times faster than the backtrackable version.

In this simple benchmark I'm matching against the list of countries in the world.
The numbers represent runs of the test per second (higher is better).
You can see this test [here](https://ellie-app.com/8gJPXf44WdQa1).

| Approach               | Mismatch  | Single match | All matches |
| ---------------------- | --------- | ------------ | ----------- |
| Trie                   | 1,591,743 | 26,684       | 1,571       |
| OneOf + backtrackable  | 28,254    | 68,314       | 435         |

The greatest speedup is in the case where no options are matched, which is the worst case scenario. Our approach fails fast.

The other two runs test matching one country in specific, or matching over a list with all countries such that every run is a match.

## Conclusion

This problem illustrates a common characteristic of problems in computer science.
Many times just choosing the right data structure already wins you the battle.

This approach was used in the implementation of the [dict-parser](https://github.com/lazamar/dict-parser/tree/1.0.2)
library for fast dictionary parsing, which you can use like this:

```elm
import Parser.Dict as DictParser

friendName : Parser String
friendName =
	[ ("joe", "joe")
	, ("joey", "joey")
	, ("john", "john")
	]
		|> Dict.fromList
		|> DictParser.fromDict
```

One last catch is that if you are not careful, options that describe a trie that is too big may overflow the stack.

You can read about the techniques to prevent that from happening in here [Recursion Patterns - Getting rid of stack overflows](https://lazamar.github.io/recursion-patterns/).

