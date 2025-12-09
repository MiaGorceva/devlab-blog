// uk.devlab.blog/js/scripts.js

document.addEventListener("DOMContentLoaded", function () {
  //
  // === 0. Год в футере ===
  //
  var yearEl = document.getElementById("year");
  if (yearEl) {
    yearEl.textContent = new Date().getFullYear();
  }

  //
  // === 1. Главная: поиск + фильтр по тегам ===
  //
  var searchInput = document.getElementById("searchInput");
  var postCards = Array.prototype.slice.call(
    document.querySelectorAll(".post-card")
  );
  var tagButtons = Array.prototype.slice.call(
    document.querySelectorAll("#categories .tag")
  );

  var activeTag = "all";

  function applyFilters() {
    if (!postCards.length) return;

    var query =
      (searchInput && searchInput.value ? searchInput.value : "")
        .toLowerCase()
        .trim();

    postCards.forEach(function (post) {
      var text = post.textContent.toLowerCase();
      var tags = (post.getAttribute("data-tags") || "").toLowerCase();

      var matchesText = !query || text.indexOf(query) !== -1;
      var matchesTag =
        activeTag === "all" || tags.indexOf(activeTag.toLowerCase()) !== -1;

      post.style.display = matchesText && matchesTag ? "" : "none";
    });
  }

  // привязываем поиск, если он есть
  if (searchInput) {
    searchInput.addEventListener("input", applyFilters);
  }

  // клики по тегам-категориям, если они есть
  if (tagButtons.length) {
    tagButtons.forEach(function (btn) {
      btn.addEventListener("click", function () {
        tagButtons.forEach(function (b) {
          b.classList.remove("active");
        });
        btn.classList.add("active");
        activeTag = btn.getAttribute("data-tag") || "all";
        applyFilters();
      });
    });
  }

  // стартовая фильтрация при наличии постов
  if (postCards.length) {
    applyFilters();
  }

  //
  // === 2. Страница поста: счётчик просмотров через CounterAPI ===
  //
  if (!document.body.classList.contains("post-page")) {
    return; // дальше только для страниц постов
  }

  // берём article
  var article = document.querySelector("main article");
  if (!article) return;

  // ключ поста: либо существующий id, либо имя файла
  var key = article.id;
  if (!key) {
    var pathParts = window.location.pathname.split("/").filter(Boolean);
    var file = pathParts.length ? pathParts[pathParts.length - 1] : "home";
    key = file.replace(/\.html?$/i, "") || "post-unknown";
    article.id = key;
  }

  // блок с просмотрами в футере статьи
  // ожидаем разметку вида:
  // <div class="post-meta-secondary">
  //   ...
  //   <span class="post-views">Views: <span class="count">—</span></span>
  // </div>
  var viewsWrapper = article.querySelector(
    ".post-meta-secondary .post-views"
  );
  if (!viewsWrapper) {
    // если вдруг забыли — создадим
    var metaSecondary = article.querySelector(".post-meta-secondary");
    if (!metaSecondary) {
      return;
    }
    viewsWrapper = document.createElement("span");
    viewsWrapper.className = "post-views";
    viewsWrapper.innerHTML = 'Views: <span class="count">—</span>';
    metaSecondary.appendChild(document.createTextNode(" · "));
    metaSecondary.appendChild(viewsWrapper);
  }

  var countSpan = viewsWrapper.querySelector(".count");
  if (!countSpan) {
    countSpan = document.createElement("span");
    countSpan.className = "count";
    countSpan.textContent = "—";
    viewsWrapper.appendChild(document.createTextNode(" "));
    viewsWrapper.appendChild(countSpan);
  }

  // namespace лучше зафиксировать руками
  var namespace = "devlab.blog"; // можно поменять, если хочешь
  var action = "view";

  // CounterAPI (https://counterapi.com)
  var url =
    "https://counterapi.com/api/" +
    encodeURIComponent(namespace) +
    "/" +
    encodeURIComponent(action) +
    "/" +
    encodeURIComponent(key);

  fetch(url)
    .then(function (res) {
      return res.json();
    })
    .then(function (data) {
      if (data && typeof data.value === "number") {
        countSpan.textContent = data.value.toLocaleString("en-US");
      }
    })
    .catch(function () {
      // тихо игнорируем ошибку, просто оставляем "—"
    });
});
