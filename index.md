---
layout: default
---

{% for post in site.posts %}
<article>
    <a href="{{ site.baseurl }}{{ post.url }}">
        {{ post.date | date: "%Y, %b %d" }} - {{ post.title }}
    </a>

</article>
{% endfor %}
