---
layout: page
title: Content
permalink: /content/
---

This section of the website contains miscellaneous thoughts.

---

{% for article in site.content %}

<article>
  <h1><a href="{{ site.baseurl }}{{ article.url }}">{{ article.title }}</a></h1>

  {{ article.content }}

  <div class="date">
    Written on {{ article.date | date: "%B %e, %Y" }}
  </div>
</article>

---

{% endfor %}
