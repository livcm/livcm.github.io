---
layout: default
title: 文章
permalink: /posts.html
description: "Aneko 写下的随笔、日常与奇想。"
---
<header class="page-header">
  <p class="eyebrow">日常的碎片，偶尔的奇想</p>
  <h1>全部手记<span class="title-period" aria-hidden="true">.</span></h1>
  <p>写过的片刻，都收在这里。<span class="post-count">共 {{ site.posts.size }} 篇</span></p>
</header>
<section class="archive-section" aria-label="文章列表">
  {% include post-list.html posts=site.posts %}
</section>
<p class="archive-license">手记采用 <a href="https://creativecommons.org/licenses/by-sa/4.0/">CC BY-SA 4.0</a> 许可协议。</p>
