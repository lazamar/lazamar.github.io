---
layout: page
title: About
permalink: /about/
description: About Marcelo Lazaroni, a software engineer in Porto working on compilers, database internals, and infrastructure, mostly in Haskell. Glean at Meta, recursive queries in Glean, open-source projects.
profile: true
---

I'm [Marcelo Lazaroni](https://www.linkedin.com/in/lazaroni/), a Portugal-based software developer who plays mainly with Haskell.

![Giving a talk at the Haskell Exchange 2019](/images/about-me_.jpg)
<small>Haskell Exchange 2019</small>

I'm into programming languages, databases, and systems software. Much of my work has been in Haskell, particularly around compilers, query languages, and developer infrastructure.

At Meta, I worked on Glean, a system for storing and querying facts about source code.
My work included the Haskell query-language compiler, query evaluation, and performance work.
I recently came back to it, aiming to get recursive query evaluation fully implemented in [Glean](https://github.com/facebookincubator/Glean/issues/736).

I've also worked on developer tooling and distributed systems, and maintain several open-source projects and experiments. More on my <a href="/cv/" title="Résumé">CV</a>.

I'm [@lazamar_](https://www.threads.com/@lazamar_) on Threads.

I write mostly about easy things like programming and algorithms. For the days when I feel like writing about the hard stuff like life and people I have [It's all about focus](http://itsallaboutfocus.com/).

Here are a couple of projects I am working on; contributions are very welcome.

## Projects

### [Haskell Docs CLI](https://github.com/lazamar/haskell-docs-cli)

Navigate Hackage documentation from the command line.

[Read the blog post]({{site.baseurl}}/haskell-documentation-in-the-command-line/)

[![haskell-docs-cli view of module documentation](../images/2021-09-19-module-documentation.png)]({{site.baseurl}}/haskell-documentation-in-the-command-line/)

### [Nix Package Versions](https://lazamar.co.uk/nix-versions/)

Find all versions of a package that were available in a Nix channel and the revision you can download it from.

[Read the blog post]({{site.baseurl}}/download-specific-package-version-with-nix/)

[![Nix Package Versions]({{ site.baseurl }}/images/about-nix-package-versions.png)](https://lazamar.co.uk/nix-versions/)

### [Silver Magpie](https://lazamar.co.uk/silver-magpie/)

A clean multi-account Twitter client for Google Chrome.

<img height=400 src="{{ site.baseurl }}/images/about-silver-magpie.gif" alt="Demo of Silver Magpie"/>

### [Dict Parser](https://github.com/lazamar/dict-parser)

Create a fast parser to match dictionary keys in Elm.

[Read the blog post]({{site.baseurl}}/fast-parsing-of-string-sets-in-elm/)


![Dict parser number of operations comparison]({{ site.baseurl }}/images/about-dict-parser.svg)

## [Glean](https://glean.software/)

I'm adding support for recursive query evaluation to Glean, the graph database that powers code analysis and navigation across Meta products.
There is an [issue](https://github.com/facebookincubator/Glean/issues/736)
with all the details and links to my working implementation. It follows the plan I [designed](https://gist.github.com/lazamar/02af16b27266f9e9866b0d5e1b857356)
when I was working full-time on it.

Evaluation is bottom-up and derives only the facts a query needs (a variant of Magic Sets), semi-naive, with suspension and streamed results.

## [Ambar Emulator](https://github.com/ambarltd/emulator)

The whole Ambar platform in a single statically linked binary that runs on a laptop.
It has Kafka-like high performance partitioned, durable, ordered queues (30k writes/s, 1M+ reads/s), database consumers, advanced flow control, and replicates an infra setup from a config file.


## [Ambar Tasks](https://github.com/ambarltd/typescript-libs/tree/main/tasks)

Durable, distributed, resumable, and fail-safe workflows embedded in TypeScript applications, with nothing but Postgres behind them. Like Temporal, but with no extra service to run and no separate compilation needed.
Workflows are monadic and can be resumed by replaying cached results, so they can run for days across restarts and crashes. They compose sequentially and in parallel, cancellation is immediate with guaranteed cleanup, and zombie workers fenced off.

The design was inspired by the paper [Composable Memory Transactions](https://simonmar.github.io/bib/papers/stm.pdf).

