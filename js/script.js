// uk.devlab.blog/js/scripts.js

document.addEventListener('DOMContentLoaded', () => {
  // ---- 1. Год в футере ----
  const yearEl = document.getElementById('year');
  if (yearEl) {
    yearEl.textContent = new Date().getFullYear();
  }

  // ---- 2. Поиск + фильтр по тегам (главная страница с постами) ----
  const searchInput = document.getElementById('searchInput');
  const postCards = Array.from(document.querySelectorAll('.post-card'));
  const tagButtons = Array.from(document.querySelectorAll('#categories .tag'));

  if (searchInput && postCards.length) {
    let activeTag = 'all';

    function applyFilters() {
      const query = (searchInput.value || '').toLowerCase().trim();

      postCards.forEach(post => {
        const text = post.textContent.toLowerCase();
        const tags = (post.getAttribute('data-tags') || '').toLowerCase().split(/\s+/);

        const matchesText = !query || text.includes(query);
        const matchesTag = activeTag === 'all' || tags.includes(activeTag);

        post.style.display = (matchesText && matchesTag) ? '' : 'none';
      });
    }

    // ввод в поиск
    searchInput.addEventListener('input', applyFilters);

    // клики по тегам
    tagButtons.forEach(btn => {
      btn.addEventListener('click', () => {
        tagButtons.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        activeTag = (btn.getAttribute('data-tag') || 'all').toLowerCase();
        applyFilters();
      });
    });

    // стартовый вызов
    applyFilters();
  }

  // ---- 3. Счётчик просмотров для страниц поста ----
  if (!document.body.classList.contains('post-page')) {
    return; // если мы не на странице поста – дальше не идём
  }

  // 3.1 Определяем id поста
  const article = document.querySelector('main article') || document.querySelector('article');
  if (!article) return;

  let postId = article.id;
  if (!postId) {
    const path = window.location.pathname;
    const file = path.split('/').filter(Boolean).pop() || 'home';
    postId = file.replace(/\.html?$/i, '');
    article.id = postId;
  }

  // 3.2 Находим контейнер для просмотров
  let viewsContainer = document.querySelector('.post-meta-secondary .post-views');

  // если его нет – создаём внизу footer статьи
  if (!viewsContainer) {
    let footer = article.querySelector('footer');
    if (!footer) {
      footer = document.createElement('footer');
      footer.className = 'post-footer';
      article.appendChild(footer);
    }

    viewsContainer = document.createElement('span');
    viewsContainer.className = 'post-views';
    footer.appendChild(viewsContainer);
  }

  // 3.3 Ключ для счётчика
  let key = viewsContainer.getAttribute('data-key') || postId;

  // 3.4 Внутренний span с числом
  let countSpan = viewsContainer.querySelector('.count');
  if (!countSpan) {
    // если в HTML уже есть текст "Views:", не трогаем его, только добавим число
    if (!viewsContainer.textContent.trim()) {
      viewsContainer.innerHTML = 'Views: <span class="count">—</span>';
    } else {
      const text = viewsContainer.textContent;
      viewsContainer.textContent = text;
      countSpan = document.createElement('span');
      countSpan.className = 'count';
      countSpan.textContent = '—';
      viewsContainer.append(' ', countSpan);
    }
  }
  if (!countSpan) {
    countSpan = viewsContainer.querySelector('.count');
  }

  // 3.5 Запрос к CountAPI
  const namespace = 'devlab.blog';
  const url =
    'https://api.countapi.xyz/hit/' +
    encodeURIComponent(namespace) +
    '/' +
    encodeURIComponent(key);

  fetch(url)
    .then(res => res.json())
    .then(data => {
      if (data && typeof data.value === 'number') {
        countSpan.textContent = data.value.toLocaleString('en-US');
      }
    })
    .catch(() => {
      // тихо игнорируем, просто оставляем "—"
    });
});
