# Posts

<ul>
  {% for post in site.posts %}
    <li>
       <a href="{{ post.url }}" title="{{ post.title }}">{{ post.title }}</a>
    </li>
  {% endfor %}
</ul>