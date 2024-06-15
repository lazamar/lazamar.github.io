---
layout: post
title: Building a data compression utility in Haskell using Huffman codes
city: Póvoa de Varzim, Portugal 🇵🇹
---

<script src="/assets/data-compressor/smvc.js"></script>
<script src="/assets/data-compressor/script.js"></script>

<style>
.h-encoded {
    font-family: monospace;
}

.h-encoded span:nth-child(odd) {
    background-color: #dadada;
}

.h-table tr:nth-child(even) {
    background-color: #eee;
}

.h-table th, .h-table td {
    padding: 0 1em;
}

</style>

<div class="huffman-visualisation"></div>
<script>
    initHuffmanVisualisation(document.querySelector(".huffman-visualisation"))
</script>
