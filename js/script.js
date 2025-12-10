// uk.devlab.blog/js/scripts.js
(function () {
  document.addEventListener("DOMContentLoaded", function () {
    // === 1. Год в футере ===
    var yearEl = document.getElementById("year");
    if (yearEl) {
      yearEl.textContent = new Date().getFullYear();
    }

    // === 2. Поиск + фильтр по тегам (главная страница) ===
    var searchInput = document.getElementById("searchInput");
    var postCards = Array.from(document.querySelectorAll(".post-card"));
    var tagButtons = Array.from(document.querySelectorAll("#categories .tag"));

    function applyFilters() {
      if (!postCards.length) return;

      var query =
        (searchInput && searchInput.value ? searchInput.value : "")
          .toLowerCase()
          .trim();

      // активный тег берём как раньше — из .tag.active
      var activeBtn = document.querySelector("#categories .tag.active");
      var activeTag = activeBtn ? (activeBtn.dataset.tag || "all") : "all";

      postCards.forEach(function (card) {
        var text = card.textContent.toLowerCase();
        var tagsAttr = (card.dataset.tags || "").toLowerCase();

        var tagsArr = tagsAttr.split(/\s+/).filter(Boolean);

        var matchesText = !query || text.indexOf(query) !== -1;
        var matchesTag =
          activeTag === "all" || tagsArr.indexOf(activeTag) !== -1;

        card.style.display = matchesText && matchesTag ? "" : "none";
      });
    }

    if (searchInput) {
      searchInput.addEventListener("input", applyFilters);
    }

    if (tagButtons.length) {
      tagButtons.forEach(function (btn) {
        btn.addEventListener("click", function () {
          tagButtons.forEach(function (b) {
            b.classList.remove("active");
          });
          btn.classList.add("active");
          applyFilters();
        });
      });
    }

    // Первая фильтрация при загрузке (если есть поиск или теги)
    if (searchInput || tagButtons.length) {
      applyFilters();
    }

    // === 3. Счётчик просмотров — только на страницах постов ===
    if (!document.body.classList.contains("post-page")) {
      return; // на главной ничего больше не делаем
    }

    var article =
      document.querySelector("main article") ||
      document.querySelector("article");
    if (!article) return;

    // 3.1. Определяем/задаём id статьи
    var postId = article.id;
    if (!postId) {
      var path = window.location.pathname;
      var file = path.split("/").filter(Boolean).pop() || "home";
      postId = file.replace(/\.html?$/i, "");
      article.id = postId;
    }

    // 3.2. Ищем блок .post-meta-secondary и вставляем туда Views
    var metaSecondary = article.querySelector(".post-meta-secondary");
    var viewsSpan = null;

    if (metaSecondary) {
      viewsSpan = metaSecondary.querySelector(".post-views");

      if (!viewsSpan) {
        // ставим "· Views: —"
        var dot = document.createElement("span");
        dot.textContent = "·";
        metaSecondary.appendChild(dot);

        viewsSpan = document.createElement("span");
        viewsSpan.className = "post-views";
        viewsSpan.innerHTML = 'Views: <span class="count">—</span>';
        metaSecondary.appendChild(viewsSpan);
      }
    } else {
      // запасной вариант — свой блок под статьёй
      var footer =
        article.querySelector("footer") || article.appendChild(document.createElement("footer"));
      footer.classList.add("post-footer-extended");

      viewsSpan = document.createElement("span");
      viewsSpan.className = "post-views";
      viewsSpan.innerHTML = 'Views: <span class="count">—</span>';
      footer.appendChild(viewsSpan);
    }

    var countEl = viewsSpan.querySelector(".count");
    if (!countEl) {
      countEl = document.createElement("span");
      countEl.className = "count";
      countEl.textContent = "—";
      viewsSpan.appendChild(countEl);
    }

    // 3.3. Позволяем руками переопределить ключ через data-key, если вдруг захочешь
    var manualKey = viewsSpan.getAttribute("data-key");
    if (manualKey) {
      postId = manualKey;
    }

    // 3.4. Вызов Google Apps Script (твой деплой)
    //var scriptId =
   //   "https://script.google.com/macros/s/AKfycbw63ZiEXuv9Hw-0tHmUaa2fVvpee2Eluwc9O9_J7BKAQwICReHKcULyP3lb2dbHxbxYZg/exec";
    var url =
      "https://script.google.com/macros/s/AKfycbxgVm8l1dx2IO7e7O5S0rXQmZugHWr2xeCb4eulOnyiIRRBFcIgQ3kC3K2pHgg0K6NeNg/exec"
    + "?post=" + encodeURIComponent(postId);
    //  scriptId +
    //  "/exec?post=" +
    //  encodeURIComponent(postId);
console.log("Views init", { postId });

    
    fetch(url)
      .then(function (res) {
        return res.json();
      })
      .then(function (data) {
        // ожидаем что-то типа { views: 123 } или { count: 123 } или { value: 123 }
        var value = null;
        if (data) {
          if (typeof data.views === "number") value = data.views;
          else if (typeof data.count === "number") value = data.count;
          else if (typeof data.value === "number") value = data.value;
        }

        if (value !== null) {
          countEl.textContent = value.toLocaleString("en-US");
        }
      })
      .catch(function () {
        // Если скрипт/интернет/Гугл легли — просто оставляем "—"
      });
  });
})();
