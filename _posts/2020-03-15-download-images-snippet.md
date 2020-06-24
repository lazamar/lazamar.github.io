---
layout: post
title: Download images from a page
---

Often I need to download many images from a web page and end up trying and adjusting far too many snippets from Stack Overflow.

Here is a snippet that works. Give it two strings to download an image.

``` javascript
async function download(url, name) {
    const res = await fetch(url);
    const blob = await res.blob();
    const blobUrl = URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.href = blobUrl
    a.download = name;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
}
```

The browser doesn't handle downloading many images at once very well. I find that adding a timeout is enough to make things work.

``` javascript
function downloadWithTimeout(url, index) {
    const f = () => download(url, `image-${index}.jpg`);
    setTimeout(f, index * 500);
}

// Use like this
myUrls.forEach(downloadWithTimeout)
```
