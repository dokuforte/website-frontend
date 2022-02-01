---
layout: article/article.liquid
pagination:
    data: pages
    size: 1
    alias: page
title: "{{ page.title }}"
page_class: "{{ page.page_class}}"
permalink: "/en/{{ page.permalink }}/"
---

{{ page.content }}