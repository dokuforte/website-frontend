---
layout: article/article.liquid
pagination:
    data: pages
    size: 1
    alias: p
permalink: "/{{ p.permalink }}/"

eleventyComputed:
  locale: "{{ p.locale }}"
  title: "{{ p.title }}"
  date: {{ p.date_updated }}
  page_class: "{{ p.page_class }}"
---
{{ p.content }}