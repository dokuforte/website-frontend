---
layout: article/article.liquid
pagination:
  data: pages-he
  size: 1
  alias: p

eleventyComputed:
  title: "{{ p.title }}"
  permalink: "{{ p.permalink }}/"
  page_class: "{{ p.page_class }}"
---

{{ p.content }}
