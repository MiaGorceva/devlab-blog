// uk.devlab.blog/js/scripts.js

(function () {
  document.addEventListener('DOMContentLoaded', function () {
    // === 0. Год в футере ===
    var yearEl = document.getElementById('year');
    if (yearEl) {
      yearEl.textContent = new Date().getFullYear();
    }

    // === 1. Поиск и фильтрация по тегам (только на главной) ===
    (function setupSearchAndTags() {
      var searchInput = document.getElementById('searchInput');
      var postList = document.getElementById('postList');

      // Если это не главная (нет списка постов) — выходим.
      if (!postList) return;

      var posts = Array.prototype.slice.call(
        document.querySelectorAll('.post-card')
      );
      var tagButtons = Array.prototype.slice.call(
        document.querySelectorAll('#categories .tag')
      );

      var activeTag = 'all';

      function applyFilters() {
        var query = (searchInput && searchInput.value ? searchInput.value : '')
          .toLowerCase()
          .trim();

        posts.forEach(function (post) {
          var text = post.textContent.toLowerCase();
          var tags = (post.getAttribute('data-tags') || '').split(/\s+/);

          var matchesText = !query || text.indexOf(query) !== -1;
          var matchesTag = activeTag === 'all' || tags.indexOf(activeTag) !== -1;

          post.style.display = (matchesText && matchesTag) ? '' : 'none';
        });
      }

      if (searchInput) {
        searchInput.addEventListener('input', applyFilters);
      }

      tagButtons.forEach(function (btn) {
        btn.addEventListener('click', function () {
          tagButtons.forEach(function (b) {
            b.classList.remove('active');
          });
          btn.classList.add('active');
          activeTag = btn.getAttribute('data-tag') || 'all';
          applyFilters();
        });
      });

      // начальная фильтрация
      applyFilters();
    })();

    // === 2. Счётчик просмотров на страницах постов ===
    (function setupPostViews() {
      // проверяем, что это страница поста
      if (!document.body.classList.contains('post-page')) return;

      // URL → ключ поста
      var path = window.location.pathname;
      var file = path.split('/').filter(Boolean).pop() || 'index';
      // например: post6-low-code-platforms-principles-benefits
      var postKey = file.replace(/\.html?$/i, '');

      // проставим id на <article>, если его нет
      var article = document.querySelector('main article');
      if (article && !article.id) {
        article.id = postKey;
      }

      // ищем контейнер для просмотров: <span class="post-views" ...>
      var viewsContainer = document.querySelector('.post-meta-secondary .post-views');
      if (!viewsContainer) {
        // если его нет, создаём внутри .post-meta-secondary
        var metaSecondary = document.querySelector('.post-meta-secondary');
        if (!metaSecondary) return;

        viewsContainer = document.createElement('span');
        viewsContainer.className = 'post-views';
        metaSecondary.appendChild(document.createTextNode(' · '));
        metaSecondary.appendChild(viewsContainer);
      }

      // если не задан data-key, используем наш постовый ключ
      var manualKey = viewsContainer.getAttribute('data-key');
      if (!manualKey) {
        viewsContainer.setAttribute('data-key', postKey);
      } else {
        postKey = manualKey;
      }

      // внутри span.post-views делаем "Views: <span class="count">—</span>"
      var countSpan = viewsContainer.querySelector('.count');
      if (!countSpan) {
        viewsContainer.innerHTML = 'Views: <span class="count">—</span>';
        countSpan = viewsContainer.querySelector('.count');
      }

      // === URL твоего Apps Script (Web App) ===
      // ЗДЕСЬ ВСТАВЬ СВОЙ URL из Deploy → Web app → URL
      var VIEWS_ENDPOINT = 'https://script.google.com/macros/s/AKfycbw63ZiEXuv9Hw-0tHmUaa2fVvpee2Eluwc9O9_J7BKAQwICReHKcULyP3lb2dbHxbxYZg/exec';

      var url =
        VIEWS_ENDPOINT +
        '?key=' +
        encodeURIComponent(postKey);

      fetch(url)
        .then(function (res) {
          return res.json();
        })
        .then(function (data) {
          if (!data) return;
          var value = data.views || data.value; // на всякий случай оба варианта
          if (typeof value === 'number') {
            countSpan.textContent = value.toLocaleString('en-US');
          }
        })
        .catch(function () {
          // если что-то пошло не так — просто оставляем "—"
        });
    })();
  });
})();
