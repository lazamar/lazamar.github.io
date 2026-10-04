---
layout: page
title: Marcelo Lazaroni
permalink: /cv/
head_title: Marcelo Lazaroni – Curriculum Vitae (CV / Resume)
description: Curriculum vitae (CV, resume) of Marcelo Lazaroni, software engineer working on compilers and database internals. Previously Meta (Glean), Ambar, Standard Chartered.
keywords: [Curriculum vitae, CV, resume, résumé, Marcelo Lazaroni, software engineer, Haskell, compilers, databases]
profile: true
---

lazaroni.marcelo@gmail.com · [github.com/lazamar](https://github.com/lazamar) · [linkedin.com/in/lazaroni](https://www.linkedin.com/in/lazaroni/) · Porto, Portugal

---

I work on compilers and database internals. I was one of the two people maintaining the core of Glean, Meta's graph database of facts about code; its query language compiler in Haskell and its runtime in C++. I have since led engineering at an event-sourcing infrastructure startup.

I like problems of correctness at scale, where it takes good abstractions to make systems both fast and safe.

---

## Experience

### Ambar — Principal Engineer ➔ VP of Product
**2023 – present** · Haskell, TypeScript, AWS

Founding engineer. Led product engineering and direction as the company grew from 4 to 19 people, managing 8 developers across two areas.

- **Set company and product direction with the CEO**, deciding what to build next and which clients to take on.
- **Hired the engineering team.** Ten senior engineers from 50+ interviews. Took them from no event-sourcing experience to shipping independently by building the first product with them — an AI assistant for estate agencies, live for 15+ agencies in three months — reviewing 305 of their pull requests.
- **Designed the type-driven event-sourcing framework behind every client application we built.** The compiler enforces domain constraints, so new hires and AI assistants write more of the code with fewer errors. Eight applications shipped on it within a year.
- **Let prospects run the entire product on a laptop.** A single static binary standing in for the whole platform: partitioned, durable, ordered queues and connectors for three databases.
- **Built a filtering DSL to support our largest client's volume.** Filters evaluate directly on encoded data, without deserialising or allocating. Typechecked against schema files and deliberately not Turing-complete.
- **Enabled language-agnostic queue consumption at full speed, no SDK needed**, by building our push protocol's backpressure mechanism, which infers client load from response times and sizes a concurrency window to match. Model-checked and regression-tested in CI.
- **Taught event sourcing to 300+ engineers** in weekly five-hour courses run to build demand.

### Meta — Software Engineer
**2021 – 2023** · Haskell, C++ · Code Search Infrastructure

Built core features of Glean, a graph database of facts about code, and of the typed Datalog-like language used to query it. Glean sits behind IDE tooling, code navigation and static analysis company-wide.

- **Designed the evaluation strategy for recursive queries**, Glean's most requested feature, to enable transitive dependency and points-to analysis over all of Meta's code. Bottom-up semi-naive evaluation with a modified Magic Sets transformation. Grounded in the Datalog and tabled-logic literature.
- **Enabled large-scale dead code detection by adding negation to Glean's query language.** Reference-existence analysis became a database query, leading directly to the removal of 26,000 lines of dead Python and C++. It also underpins company-wide symbol search.
- **Took schema migrations from over two months to under a week** with automatic backwards- and forwards-compatible schema changes. Migrations had needed separate pipelines and coordination across 17 clients; the feature cleared a backlog of blocked changes.
- **Made incremental indexing viable.** I sped up a key indexing step for Hack, Meta's PHP dialect, from over 80 minutes to under 3, and total creation from 120 minutes to 40; index freshness went from 4–5 hours to 1–2.
- **Kept distributed code indexing ahead of data growth by fixing a key performance bottleneck**. I traced it to our TLS cipher, which wasn't optimised for our CPU architecture. The fix made database transfers 25x faster and the largest indexes two hours fresher.
- **Resolved cluster overload without new hardware** with a query-compilation optimisation that prunes unproductive branches: P95 compilation fell from 27 ms to 2.5 ms, and the heaviest client's load dropped sevenfold.
- **Unblocked the company's response to the Log4j vulnerability.** The build system ran out of memory enumerating affected targets; I wrote the Glean script that found all of them, with the owning team for each.
- **Eliminated a recurring source of production instability** by implementing request prioritisation in the open-source Haskell Thrift library — server restarts from missed health checks went from 100 a week to zero, everywhere the library is used.

### Standard Chartered Bank — Quantitative Developer
**2019 – 2021** · Haskell · Strats, Financial Markets

Owned the interest-rate swaps section of a million-line derivative pricing service, and the relationship with the traders it served.

- **Implemented real-time trades pricing**, going from on-demand swap pricing to streaming prices multiple times per second.
- **Made upstream data validation fast enough to run continuously** by removing a 2ⁿ factor from its time complexity — found by auditing the code and spotting a property of the calculation that made it tractable.

### Pushfor — Lead Frontend Engineer
**2018 – 2019** · TypeScript, Elm

Promoted to lead four months after joining, after rebuilding the most error-prone part of the product.

- **Reduced new bugs tenfold** and ended debugging sessions with clients, by making the case for restructuring the frontend and leading three developers through a staged migration.

### Code Dock — Director
**2017 – present** · TypeScript, Elm

A one-person company, founded for the project below; now runs paid internships for new programmers.

- **Won, negotiated and delivered a CRM platform for a financial consultancy managing over £5bn in client assets**, later expanded to cover expenses, project leads and time tracking.

---

## Selected projects

- [**Nix Package Versions**](https://github.com/lazamar/nix-package-versions) — find every version ever available for any Nix package. Haskell.
- [**haskell-docs-cli**](https://github.com/lazamar/haskell-docs-cli) — browse Hackage from the terminal.
- [**lazamar.github.io**](https://lazamar.github.io/) — writing on compilers, performance and functional programming.

## Education

**BSc Computer Science, First Class Honours** — University of West London, 2013–2016. Awarded scholarships for academic performance in 2013 and 2014.
