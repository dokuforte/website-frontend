---
layout: article/article.liquid
pagination:
    data: pages
    size: 1
    alias: p
eleventyComputed:
  title: "{{ p.title }}"
  page_class: "{{ p.page_class }}"
  permalink: "/en/{{ p.permalink }}/"
  date: {{ p.date }}
---
{{ p.content }}