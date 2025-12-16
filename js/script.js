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
    if (!document.body.classList.contains("post-page")) return;

    var article = document.querySelector("main article") || document.querySelector("article");
    if (!article) return;

    // 3.1. id статьи
    var postId = article.id;
    if (!postId) {
      var path = window.location.pathname;
      var file = path.split("/").filter(Boolean).pop() || "home";
      postId = file.replace(/\.html?$/i, "");
      article.id = postId;
    }

    // 3.2. Гарантируем, что в каждом .post-meta-secondary есть .post-views
    var metaBlocks = Array.from(article.querySelectorAll(".post-meta-secondary"));
    metaBlocks.forEach(function (metaSecondary) {
      var viewsSpan = metaSecondary.querySelector(".post-views");
      if (!viewsSpan) {
        var dot = document.createElement("span");
        dot.textContent = "·";
        metaSecondary.appendChild(dot);

        viewsSpan = document.createElement("span");
        viewsSpan.className = "post-views";
        viewsSpan.innerHTML = 'Views: <span class="count">—</span>';
        metaSecondary.appendChild(viewsSpan);
      }
    });

    // если вообще нет meta-block’ов — fallback
    if (!metaBlocks.length) {
      var footer = article.querySelector("footer") || article.appendChild(document.createElement("footer"));
      footer.classList.add("post-footer-extended");

      var viewsSpan = footer.querySelector(".post-views");
      if (!viewsSpan) {
        viewsSpan = document.createElement("span");
        viewsSpan.className = "post-views";
        viewsSpan.innerHTML = 'Views: <span class="count">—</span>';
        footer.appendChild(viewsSpan);
      }
    }

    // соберём ВСЕ count-элементы на странице статьи
    var countEls = Array.from(article.querySelectorAll(".post-views .count"));

    // 3.3. ручной key (если надо)
    var manualKeyEl = article.querySelector(".post-views[data-key]");
    if (manualKeyEl && manualKeyEl.getAttribute("data-key")) {
      postId = manualKeyEl.getAttribute("data-key");
    }

    // 3.4. JSONP (с анти-кэшем)
    window.updateViews = function (data) {
      console.log("JSONP data:", data);
      if (data && typeof data.views === "number") {
        var v = data.views.toLocaleString("en-US");
        countEls.forEach(function (el) { el.textContent = v; });
      }
    };

    var url =
      "https://script.google.com/macros/s/AKfycbz3O_smyEG9F2xsOcxxkG0wsWKXGB4gfuOv2OIYw6vO3dzvzBPJTnT2WgsjzopftF3Vxg/exec" +
      "?callback=updateViews&post=" + encodeURIComponent(postId) +
      "&t=" + Date.now(); // <-- важно

    var script = document.createElement("script");
    script.src = url;
    document.body.appendChild(script);

    /* 1) СНАЧАЛА объявляем колбэк в глобальной области
    window.updateViews = function (data) {
      console.log("JSONP data:", data);
      if (data && typeof data.views === "number") {
        countEl.textContent = data.views.toLocaleString("en-US");
      }
    };

    // 2) Потом подключаем JSONP-скрипт
    var script = document.createElement("script");
    script.src = url;
    document.body.appendChild(script);*/
  
  });
})();

// === Мобильное меню (бургер ↔ крест) ===
var navToggle = document.querySelector(".nav-toggle");
var navGroup  = document.querySelector(".nav-group");
var navCta    = document.querySelector(".nav-cta");

if (navToggle && navGroup) {
  // начальное состояние
  navToggle.setAttribute("aria-expanded", "false");
  navToggle.textContent = "☰";

  navToggle.addEventListener("click", function () {
    var isOpen = document.body.classList.toggle("nav-open");

    navToggle.textContent = isOpen ? "×" : "☰";
    navToggle.setAttribute("aria-expanded", isOpen ? "true" : "false");
  });
}
(function () {
  document.addEventListener("DOMContentLoaded", function () {
    // Работает только на страницах, где есть список постов
    var list = document.querySelector(".post-list");
    if (!list) return;

    var cards = Array.from(list.querySelectorAll(".post-card"));
    if (!cards.length) return;

    // === CONFIG ===
    // ТВОЙ Apps Script endpoint (тот же, что для постов)
    var VIEWS_ENDPOINT =
      "https://script.google.com/macros/s/AKfycbz3O_smyEG9F2xsOcxxkG0wsWKXGB4gfuOv2OIYw6vO3dzvzBPJTnT2WgsjzopftF3Vxg/exec";

    // 1) соберём метаданные
    var items = cards.map(function (card) {
      var postId = card.getAttribute("data-post-id") || "";
      var dateStr = card.getAttribute("data-date") || "";
      var date = dateStr ? new Date(dateStr) : new Date(0);

      return {
        card: card,
        postId: postId,
        date: date,
        views: null
      };
    });

    // 2) найдём "последний опубликованный" (будет pinned)
    var pinned = items.reduce(function (best, cur) {
      return cur.date > best.date ? cur : best;
    }, items[0]);

    // 3) JSONP helper (один пост -> views)
    function fetchViewsJSONP(postId) {
      return new Promise(function (resolve) {
        if (!postId) return resolve(0);

        var cbName = "__views_cb_" + Math.random().toString(36).slice(2);
        window[cbName] = function (data) {
          try {
            var v = (data && typeof data.views === "number") ? data.views : 0;
            resolve(v);
          } catch (e) {
            resolve(0);
          } finally {
            // cleanup
            try { delete window[cbName]; } catch (e) { window[cbName] = undefined; }
            if (script && script.parentNode) script.parentNode.removeChild(script);
          }
        };

        var script = document.createElement("script");
        script.src =
          VIEWS_ENDPOINT +
          "?callback=" + encodeURIComponent(cbName) +
          "&post=" + encodeURIComponent(postId) +
          "&_=" + Date.now(); // cache-bust

        script.onerror = function () {
          resolve(0);
          try { delete window[cbName]; } catch (e) {}
          if (script && script.parentNode) script.parentNode.removeChild(script);
        };

        document.body.appendChild(script);
      });
    }

    // 4) грузим просмотры (параллельно, но аккуратно)
    Promise.all(items.map(function (it) {
      return fetchViewsJSONP(it.postId).then(function (v) {
        it.views = v;
        // опционально: можно записать в data-views
        it.card.setAttribute("data-views", String(v));
        return v;
      });
    })).then(function () {
      // 5) сортируем: pinned первый, остальные по views desc, потом date desc
      var sorted = items.slice().sort(function (a, b) {
        // pinned first
        if (a === pinned && b !== pinned) return -1;
        if (b === pinned && a !== pinned) return 1;

        var av = (typeof a.views === "number") ? a.views : 0;
        var bv = (typeof b.views === "number") ? b.views : 0;

        if (bv !== av) return bv - av;
        return b.date - a.date;
      });

      // 6) переставляем DOM (без перерендера)
      sorted.forEach(function (it) {
        list.appendChild(it.card);
      });
    });
  });
})();
document.querySelectorAll(".post-image img").forEach(function (img) {
  if (img.complete) applyRatio(img);
  else img.addEventListener("load", function () {
    applyRatio(img);
  });
});

function applyRatio(img) {
  var w = img.naturalWidth;
  var h = img.naturalHeight;
  var box = img.closest(".post-image");

  if (!box || !w || !h) return;

  box.classList.remove("ratio-square", "ratio-portrait", "ratio-landscape");

  if (Math.abs(w - h) / w < 0.1) {
    box.classList.add("ratio-square");
  } else if (h > w) {
    box.classList.add("ratio-portrait");
  } else {
    box.classList.add("ratio-landscape");
  }
}

