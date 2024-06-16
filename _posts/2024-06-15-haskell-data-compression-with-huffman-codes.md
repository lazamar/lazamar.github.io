---
layout: post
title: Building a data compression utility in Haskell using Huffman codes
city: Póvoa de Varzim, Portugal 🇵🇹
---

<script src="/assets/data-compressor/smvc.js"></script>
<script src="/assets/data-compressor/script.js"></script>

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
