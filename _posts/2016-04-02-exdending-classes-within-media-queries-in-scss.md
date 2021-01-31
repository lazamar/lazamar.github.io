---
layout: post
title: SCSS - Extending Classes Within Media Queries
city: London, UK
---
If you have used SASS for some time you will know that if you are within a
media query and try to extend a class that is outside of the media query
you will get an error. Let's find a way around it.


## The problem

If you do this:

``` scss
.small-btn {
  padding: 5px;
  &:hover {
    background-color: white;
    color:black;
  }
}

@media (max-width: 768px) {
  button {
    @extend .small-btn;
  }
}
```

You will get this:

```
Error: You may not @extend an outer selector from within @media.
       You may only @extend selectors within the same directive.
       From "@extend .small-btn" on line 7 of src/scss/main.scss
```

This is very annoying and can be a hindrance when your are trying to do
some really interesting things in responsive websites. To go around this
limitation we must find a way to include a collection of rules and sub-rules
within a class inside a media query.

## A way around it

The answer we are looking for is a `@mixin`. With a `@mixin` we can import
all the rules that we want very easily. What we would have to do is to put
the code from the class we want to extend inside of a `@mixin` instead of
inside the class itself. Then both the class and the section inside the media
query will import the `@mixin` functionality.


Here is how it could look like:

``` scss
@mixin small-btn-mixin() {
  padding: 5px;
  &:hover {
    background-color: white;
    color:black;
  }
}

.small-btn {
  @include small-btn-mixin();
}

@media (max-width: 768px) {
  button {
    @include small-btn-mixin();
  }
}
```

A limitation of this method is that you have to explicitly create a mixin for
every class you want to extend within a media query.  With the '@extend' keyword,
on the other hand, you can extend any class on the fly without further
complications. Also, be mindful that with
`@extend` SASS would integrate all instances where there is code associated with
this class, while this method will only include what was declared within the
`@mixin`.


Although not perfect, this method does provide us with an alternative
to having to repeat code.

---
**TL;DR**

- Instead of extending, put the code you want to reproduce inside a `@mixin`.

``` scss
 @mixin small-btn-mixin() {
   padding: 5px;
   &:hover {
     background-color: white;
     color:black;
   }
 }

 @media (max-width: 768px) {
   button {
     @include small-btn-mixin();
   }
 }
```

---
