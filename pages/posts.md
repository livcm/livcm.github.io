# Posts

<ul>
  {% for post in site.posts %}
    <li>
       <a href="{{ post.url }}" title="{{ post.title }}">{{ post.title }}</a>
    </li>
  {% endfor %}
</ul>

[![License](https://img.shields.io/badge/CC--BY--SA-4.0-EF9421.svg?style=for-the-badge&logo=creativecommons)](http://creativecommons.org/licenses/by-sa/4.0/)