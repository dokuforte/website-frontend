---
layout: article/article.liquid
pagination:
    data: pages
    size: 1
    alias: p
permalink: "/{{ p.locale }}/{{ p.permalink }}/"
eleventyComputed:
  title: "{{ p.title }}"
  date: {{ p.date }}
---
{{ p.content }}