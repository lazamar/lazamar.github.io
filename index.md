---
layout: default
---

{% for post in site.posts %}

<article style="display: flex; flex-wrap: no-wrap;">
        <span style="min-width: 6.5em; display: inline-block">
            {{ post.date | date: "%Y, %b %d" }}
        </span>
        <a href="{{ site.baseurl }}{{ post.url }}">
            {{ post.title }}
        </a>
</article>
{% endfor %}
