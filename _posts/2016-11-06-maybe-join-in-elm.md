---
layout: post
title: Maybe.join in Elm
---

Elm doesn't have a `join` method in it's `Maybe` type, so how do we join `Maybe`s?

You need to join a `Maybe` when you have a `Maybe` inside another. Something like this:

```
Just ( Just 2 )
```

In Elm we can use the helpful `[withDefault](http://package.elm-lang.org/packages/elm-lang/core/latest/Maybe#withDefault)`, which is meant to peal the `Maybe` onion, removing its encapsulating layer. With it we can easily do a join.

```

Maybe.withDefault Nothing  (Just (Just 2) )

-- Result: Just 2

```

We can also use the sophisticated `[andThen](http://package.elm-lang.org/packages/elm-lang/core/latest/Maybe#andThen)`, which says: "If I have something, rather than nothing, I will give you my value, but you must promise to return another value wrapped in a `Maybe`".

Because our inner value is already a `Maybe`, we can just pass the `identity` function to it and voilà!

```

(Just ( Just 2 ) ) `Maybe.andThen` indentity

-- Result: Just 2

```


Here is an *[SSCCE](http://sscce.org/)* example to try at [elm-lang.org/try](elm-lang.org/try)

```
import Html exposing (text, div)

join : Maybe (Maybe a) -> Maybe a
join =
  \x -> x `Maybe.andThen` (\g -> g)



join' : Maybe (Maybe a) -> Maybe a
join' =
  Maybe.withDefault Nothing



main =
  div []
    [ text <| toString <| join  (Just (Just 2) )
    , text <| toString <| join'  (Just (Just 3) )
    ]


-- Output: Just 2Just 3

```
