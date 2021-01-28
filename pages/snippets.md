---
layout: page
title: Snippets
permalink: /snippets/
---

A collection snippets that are useful to fetch quickly.

#### Compress all images in a directory

Requires `imagemagick`.

    ls -1 | cut -d '.' -f1 | xargs -I {} convert {}.jpg -sampling-factor 4:2:0 -strip -quality 85 -interlace JPEG -colorspace RGB {}_converted.jpg

Conversion options recommended from [PageSpeed insights](https://developers.google.com/speed/docs/insights/OptimizeImages)
