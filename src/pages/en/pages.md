---
layout: article/article.liquid
pagination:
    data: pages
    size: 1
    alias: p
permalink: "/{{ p.locale }}/{{ p.permalink }}/"
title: "{{ p.title }}"
eleventyComputed:
  date: {{ p.date }}
---
{{ p.content }}