// uk.devlab.blog/js/scripts.js
(function () {
  document.addEventListener("DOMContentLoaded", function () {
    /* =========================
       1) Footer year
       ========================= */
    var yearEl = document.getElementById("year");
    if (yearEl) yearEl.textContent = new Date().getFullYear();

    /* =========================
       2) Mobile nav (burger ↔ cross)
       ========================= */
    var navToggle = document.querySelector(".nav-toggle");
    if (navToggle) {
      navToggle.setAttribute("aria-expanded", "false");
      navToggle.textContent = "☰";

      navToggle.addEventListener("click", function () {
        var isOpen = document.body.classList.toggle("nav-open");
        navToggle.textContent = isOpen ? "×" : "☰";
        navToggle.setAttribute("aria-expanded", isOpen ? "true" : "false");
      });
    }

    /* =========================
       3) Search + tag filter (index pages)
       ========================= */
    var searchInput = document.getElementById("searchInput");
    var postCards = Array.from(document.querySelectorAll(".post-card"));
    var tagButtons = Array.from(document.querySelectorAll("#categories .tag"));

    function applyFilters() {
      if (!postCards.length) return;

      var query = ((searchInput && searchInput.value) ? searchInput.value : "")
        .toLowerCase()
        .trim();

      var activeBtn = document.querySelector("#categories .tag.active");
      var activeTag = activeBtn ? (activeBtn.dataset.tag || "all") : "all";

      postCards.forEach(function (card) {
        var text = (card.textContent || "").toLowerCase();
        var tagsAttr = ((card.dataset && card.dataset.tags) ? card.dataset.tags : "").toLowerCase();
        var tagsArr = tagsAttr.split(/\s+/).filter(Boolean);

        var matchesText = !query || text.indexOf(query) !== -1;
        var matchesTag = (activeTag === "all") || (tagsArr.indexOf(activeTag) !== -1);

        card.style.display = (matchesText && matchesTag) ? "" : "none";
      });
    }

    if (searchInput) searchInput.addEventListener("input", applyFilters);

    if (tagButtons.length) {
      tagButtons.forEach(function (btn) {
        btn.addEventListener("click", function () {
          tagButtons.forEach(function (b) { b.classList.remove("active"); });
          btn.classList.add("active");
          applyFilters();
        });
      });
    }

    if (searchInput || tagButtons.length) applyFilters();

    /* =========================
       Helpers: postId + date from DOM
       ========================= */
    function getPostIdFromArticle(articleEl) {
      // priority: article.id -> filename
      var postId = articleEl.id;
      if (postId) return postId;

      var path = window.location.pathname;
      var file = path.split("/").filter(Boolean).pop() || "home";
      postId = file.replace(/\.html?$/i, "");
      articleEl.id = postId;
      return postId;
    }

    function getPostIdFromCard(card) {
      // priority: data-post-id -> href filename
      var explicit = card.getAttribute("data-post-id");
      if (explicit) return explicit;

      var a = card.querySelector('a[href$=".html"], a[href*=".html"]');
      if (!a) return "";

      var href = a.getAttribute("href") || "";
      var file = href.split("/").filter(Boolean).pop() || "";
      return file.replace(/\.html?$/i, "");
    }

    function getDateFromCard(card) {
      // priority: data-date -> try parse; else epoch
      var dateStr = card.getAttribute("data-date") || "";
      var d = dateStr ? new Date(dateStr) : new Date(0);
      return isNaN(+d) ? new Date(0) : d;
    }

    /* =========================
       JSONP helper (views)
       ========================= */
    var VIEWS_ENDPOINT =
      "https://script.google.com/macros/s/AKfycbz3O_smyEG9F2xsOcxxkG0wsWKXGB4gfuOv2OIYw6vO3dzvzBPJTnT2WgsjzopftF3Vxg/exec";

    function fetchViewsJSONP(postId) {
      return new Promise(function (resolve) {
        if (!postId) return resolve(0);

        var cbName = "__views_cb_" + Math.random().toString(36).slice(2);
        var script = document.createElement("script");

        window[cbName] = function (data) {
          try {
            var v = (data && typeof data.views === "number") ? data.views : 0;
            resolve(v);
          } catch (e) {
            resolve(0);
          } finally {
            try { delete window[cbName]; } catch (e) { window[cbName] = undefined; }
            if (script && script.parentNode) script.parentNode.removeChild(script);
          }
        };

        script.onerror = function () {
          resolve(0);
          try { delete window[cbName]; } catch (e) {}
          if (script && script.parentNode) script.parentNode.removeChild(script);
        };

        script.src =
          VIEWS_ENDPOINT +
          "?callback=" + encodeURIComponent(cbName) +
          "&post=" + encodeURIComponent(postId) +
          "&_=" + Date.now(); // cache-bust

        document.body.appendChild(script);
      });
    }

    /* =========================
       4) Views on POST pages
       ========================= */
    if (document.body.classList.contains("post-page")) {
      var article = document.querySelector("main article") || document.querySelector("article");
      if (!article) return;

      var postId = getPostIdFromArticle(article);

      // Ensure .post-views exists in every .post-meta-secondary
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

      // Fallback if no meta blocks exist
      if (!metaBlocks.length) {
        var footer = article.querySelector("footer") || article.appendChild(document.createElement("footer"));
        footer.classList.add("post-footer-extended");

        var viewsSpan2 = footer.querySelector(".post-views");
        if (!viewsSpan2) {
          viewsSpan2 = document.createElement("span");
          viewsSpan2.className = "post-views";
          viewsSpan2.innerHTML = 'Views: <span class="count">—</span>';
          footer.appendChild(viewsSpan2);
        }
      }

      // Allow manual key override via data-key on any .post-views
      var manualKeyEl = article.querySelector(".post-views[data-key]");
      if (manualKeyEl && manualKeyEl.getAttribute("data-key")) {
        postId = manualKeyEl.getAttribute("data-key");
      }

      // Update all counters on the page
      var countEls = Array.from(article.querySelectorAll(".post-views .count"));

      fetchViewsJSONP(postId).then(function (views) {
        var v = Number(views || 0).toLocaleString("en-US");
        countEls.forEach(function (el) { el.textContent = v; });
      });

      // On post pages we don't need list sorting below
      return;
    }

    /* =========================
       5) Sort post cards on INDEX pages:
          - Pin latest by data-date first
          - Others by views desc
          - Tie-break by date desc
       ========================= */
    var list = document.querySelector(".post-list");
    if (!list) return;

    var cards = Array.from(list.querySelectorAll(".post-card"));
    if (!cards.length) return;

    var items = cards.map(function (card) {
      var postId = getPostIdFromCard(card);
      var date = getDateFromCard(card);

      return {
        card: card,
        postId: postId,
        date: date,
        views: 0
      };
    });

    // Pinned = most recently published (by data-date)
    var pinned = items.reduce(function (best, cur) {
      return (cur.date > best.date) ? cur : best;
    }, items[0]);

    // Fetch views for all (JSONP per card)
    Promise.all(items.map(function (it) {
      return fetchViewsJSONP(it.postId).then(function (v) {
        it.views = (typeof v === "number") ? v : 0;
        it.card.setAttribute("data-views", String(it.views));
        return it.views;
      });
    })).then(function () {
      var sorted = items.slice().sort(function (a, b) {
        // pinned first
        if (a === pinned && b !== pinned) return -1;
        if (b === pinned && a !== pinned) return 1;

        // views desc
        if (b.views !== a.views) return b.views - a.views;

        // date desc
        return b.date - a.date;
      });

      // Reorder DOM
      sorted.forEach(function (it) {
        list.appendChild(it.card);
      });
    });
  });
})();
