---
layout: default
title: "奇幻菌的奇想手记"
---
<section class="home-hero" aria-labelledby="home-title">
  <div class="hero-copy">
    <p class="eyebrow"><span class="eyebrow-line" aria-hidden="true"></span>随笔 · 日常 · 奇想</p>
    <h1 id="home-title">奇幻菌的<br>奇想手记<span class="title-period" aria-hidden="true">.</span></h1>
    <p class="hero-description">{{ site.description }}</p>
    <a class="text-link hero-link" href="#latest-posts">翻开手记 <span aria-hidden="true">↓</span></a>
  </div>
  <div class="hero-art">{% include landscape.html %}</div>
</section>

<section class="latest-section" id="latest-posts" aria-labelledby="latest-title">
  <div class="section-heading">
    <div><p class="eyebrow">写下来的片刻</p><h2 id="latest-title">最新手记</h2></div>
    <a class="text-link" href="{{ '/posts.html' | relative_url }}">全部文章 <span aria-hidden="true">→</span></a>
  </div>
  {% include post-list.html posts=site.posts limit=3 title_tag='h3' %}
</section>

<section class="personal-section" aria-labelledby="contact-title">
  <div class="personal-intro">
    <p class="eyebrow">手记之外</p>
    <h2 id="contact-title">在别处找到我</h2>
    <p>我是奇幻菌。<br>欢迎来打个招呼，喵～</p>
    <a class="text-link" href="{{ site.source_url }}/issues/new">给手记留个反馈 <span aria-hidden="true">↗</span></a>
  </div>
  <div class="personal-content">
    <ul class="contact-list">
      {% for contact in site.data.profile.contacts %}
      <li><a class="contact-link" href="{{ contact.url | escape }}">{% include profile-icon.html name=contact.icon %}<span class="contact-copy"><span class="contact-name">{{ contact.name | escape }}</span><span class="contact-handle">{{ contact.handle | escape }} <span class="contact-arrow" aria-hidden="true">↗</span></span></span></a></li>
      {% endfor %}
    </ul>
    <details class="game-accounts">
      <summary><span>游戏里的我 <span class="summary-note">账号与服务器</span></span><span class="disclosure-arrow" aria-hidden="true">+</span></summary>
      <dl class="game-list">
        {% for game in site.data.profile.games %}
        <div><dt><img class="game-icon" src="{{ game.icon | relative_url }}" width="32" height="32" alt="" loading="lazy"><span>{{ game.name | escape }}</span></dt><dd>{% for account in game.accounts %}<p><code>{{ account.id | escape }}</code><span class="server-label">{{ account.server | escape }}</span></p>{% endfor %}</dd></div>
        {% endfor %}
      </dl>
    </details>
  </div>
</section>

<aside class="home-notes" aria-label="网站信息">
  {% include repository-stats.html %}
  <div class="home-smallprint"><span>始于 <time datetime="2022-11-12">2022.11.12</time></span><span class="local-clock" data-clock-wrapper hidden>你的本地时间 <time id="currentTime"></time></span></div>
</aside>
