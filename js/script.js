// js/script.js
(() => {
  "use strict";

  document.addEventListener("DOMContentLoaded", () => {
    /* =========================
       1) Footer year
       ========================= */
    const yearEl = document.getElementById("year");
    if (yearEl) yearEl.textContent = String(new Date().getFullYear());

    /* =========================
       2) Mobile nav (burger ↔ cross)
       ========================= */
    const navToggle = document.querySelector(".nav-toggle");
    if (navToggle) {
      navToggle.setAttribute("aria-expanded", "false");
      navToggle.textContent = "☰";

      navToggle.addEventListener("click", () => {
        const isOpen = document.body.classList.toggle("nav-open");
        navToggle.textContent = isOpen ? "×" : "☰";
        navToggle.setAttribute("aria-expanded", isOpen ? "true" : "false");
      });
    }

    /* =========================
       Helpers: language detection + analytics
       ========================= */
    const host = (location.hostname || "").toLowerCase();
    const htmlLang = (document.documentElement.getAttribute("lang") || "").toLowerCase();

    function detectLang() {
      // en.devlab.blog | ru.devlab.blog | pl.devlab.blog | uk.devlab.blog (UA)
      if (host.startsWith("ru.")) return "ru";
      if (host.startsWith("pl.")) return "pl";
      if (host.startsWith("uk.")) return "uk";
      if (host.startsWith("en.")) return "en";

      if (htmlLang.startsWith("ru")) return "ru";
      if (htmlLang.startsWith("pl")) return "pl";
      if (htmlLang.startsWith("uk") || htmlLang.startsWith("ua")) return "uk";
      return "en";
    }

    const lang = detectLang();

    function dlPush(payload) {
      window.dataLayer = window.dataLayer || [];
      window.dataLayer.push(payload);
    }

    /* =========================
       3) Search + tag filter (index pages)
       ========================= */
    const searchInput = document.getElementById("searchInput");
    const postCards = Array.from(document.querySelectorAll(".post-card"));
    const tagButtons = Array.from(document.querySelectorAll("#categories .tag"));

    function applyFilters() {
      if (!postCards.length) return;

      const query = ((searchInput && searchInput.value) ? searchInput.value : "")
        .toLowerCase()
        .trim();

      const activeBtn = document.querySelector("#categories .tag.active");
      const activeTag = activeBtn ? (activeBtn.dataset.tag || "all") : "all";

      postCards.forEach((card) => {
        const text = (card.textContent || "").toLowerCase();
        const tagsAttr = ((card.dataset && card.dataset.tags) ? card.dataset.tags : "").toLowerCase();
        const tagsArr = tagsAttr.split(/\s+/).filter(Boolean);

        const matchesText = !query || text.includes(query);
        const matchesTag = (activeTag === "all") || tagsArr.includes(activeTag);

        card.style.display = (matchesText && matchesTag) ? "" : "none";
      });
    }

    if (searchInput) searchInput.addEventListener("input", applyFilters);

    if (tagButtons.length) {
      tagButtons.forEach((btn) => {
        btn.addEventListener("click", () => {
          tagButtons.forEach((b) => b.classList.remove("active"));
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
      let postId = articleEl.id;
      if (postId) return postId;

      const path = window.location.pathname;
      const file = path.split("/").filter(Boolean).pop() || "home";
      postId = file.replace(/\.html?$/i, "");
      articleEl.id = postId;
      return postId;
    }

    function getPostIdFromCard(card) {
      // priority: data-post-id -> href filename
      const explicit = card.getAttribute("data-post-id");
      if (explicit) return explicit;

      const a = card.querySelector('a[href$=".html"], a[href*=".html"]');
      if (!a) return "";

      const href = a.getAttribute("href") || "";
      const file = href.split("/").filter(Boolean).pop() || "";
      return file.replace(/\.html?$/i, "");
    }

    function getDateFromCard(card) {
      // priority: data-date -> try parse; else epoch
      const dateStr = card.getAttribute("data-date") || "";
      const d = dateStr ? new Date(dateStr) : new Date(0);
      return isNaN(+d) ? new Date(0) : d;
    }

    /* =========================
   JSONP helper (universal)
   ========================= */
function fetchJSONP(baseUrl, params) {
  return new Promise((resolve) => {
    const cbName = "__jsonp_cb_" + Math.random().toString(36).slice(2);
    const script = document.createElement("script");

    window[cbName] = (data) => {
      try { resolve(data ?? null); }
      finally {
        try { delete window[cbName]; } catch { window[cbName] = undefined; }
        if (script && script.parentNode) script.parentNode.removeChild(script);
      }
    };

    script.onerror = () => {
      resolve(null);
      try { delete window[cbName]; } catch {}
      if (script && script.parentNode) script.parentNode.removeChild(script);
    };

    const q = new URLSearchParams({
      callback: cbName,
      _: String(Date.now()),
      ...(params || {})
    });

    script.src = baseUrl + "?" + q.toString();
    document.body.appendChild(script);
  });
}

/* =========================
   4) Views (JSONP)
   ========================= */
const VIEWS_ENDPOINT =
  "https://script.google.com/macros/s/AKfycbz3O_smyEG9F2xsOcxxkG0wsWKXGB4gfuOv2OIYw6vO3dzvzBPJTnT2WgsjzopftF3Vxg/exec";

function fetchViewsJSONP(postId) {
  if (!postId) return Promise.resolve(0);

  return fetchJSONP(VIEWS_ENDPOINT, { post: postId }).then((data) => {
    const v = (data && typeof data.views === "number") ? data.views : 0;
    return v;
  });
}

/* =========================
   5) Views on POST pages
   ========================= */
if (document.body.classList.contains("post-page")) {
  const article = document.querySelector("main article") || document.querySelector("article");
  if (!article) return;

  let postId = getPostIdFromArticle(article);

  // Ensure .post-views exists in every .post-meta-secondary
  const metaBlocks = Array.from(article.querySelectorAll(".post-meta-secondary"));
  metaBlocks.forEach((metaSecondary) => {
    let viewsSpan = metaSecondary.querySelector(".post-views");
    if (!viewsSpan) {
      const dot = document.createElement("span");
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
    const footer = article.querySelector("footer") || article.appendChild(document.createElement("footer"));
    footer.classList.add("post-footer-extended");

    let viewsSpan2 = footer.querySelector(".post-views");
    if (!viewsSpan2) {
      viewsSpan2 = document.createElement("span");
      viewsSpan2.className = "post-views";
      viewsSpan2.innerHTML = 'Views: <span class="count">—</span>';
      footer.appendChild(viewsSpan2);
    }
  }

  // Allow manual key override via data-key on any .post-views
  const manualKeyEl = article.querySelector(".post-views[data-key]");
  if (manualKeyEl && manualKeyEl.getAttribute("data-key")) {
    postId = manualKeyEl.getAttribute("data-key");
  }

  // Update all counters on the page
  const countEls = Array.from(article.querySelectorAll(".post-views .count"));

  fetchViewsJSONP(postId).then((views) => {
    const v = Number(views || 0).toLocaleString("en-US");
    countEls.forEach((el) => { el.textContent = v; });
  });
}

/* =========================
   6) Reactions (👍/👎) — JSONP (no CORS)
   ========================= */
const REACTIONS_ENDPOINT =
  "https://script.google.com/macros/s/AKfycbzrikgWx4c27jDaCBboSUL6cM9HS4jVGfeMfspdcVTzBuVxDYgS-AyResoOsUt3W7GA1A/exec";

function setReactionCounts(data) {
  const likeEl = document.querySelector('[data-count="like"]');
  const dislikeEl = document.querySelector('[data-count="dislike"]');
  if (likeEl) likeEl.textContent = String((data && data.like) ?? 0);
  if (dislikeEl) dislikeEl.textContent = String((data && data.dislike) ?? 0);
}

function getPostIdForReactions() {
  const article = document.querySelector("main article") || document.querySelector("article");
  if (!article) return null;
  return getPostIdFromArticle(article);
}

function initReactions() {
  if (!document.body.classList.contains("post-page")) return;

  const postId = getPostIdForReactions();
  if (!postId) return;

  const buttons = Array.from(document.querySelectorAll("button[data-vote]"));
  if (!buttons.length) return;

  // Load counts (JSONP)
  fetchJSONP(REACTIONS_ENDPOINT, { post_id: postId }).then((data) => {
    if (data) setReactionCounts(data);
  });

  // Vote (JSONP)
  buttons.forEach((btn) => {
    btn.addEventListener("click", async () => {
      const vote = btn.getAttribute("data-vote");
      if (!vote) return;


      const key = `voted:${postId}`;
      if (localStorage.getItem(key)) return;

      // optimistic UI
      const current = {
        like: Number(document.querySelector('[data-count="like"]')?.textContent || 0),
        dislike: Number(document.querySelector('[data-count="dislike"]')?.textContent || 0),
      };
      if (vote === "like") current.like += 1;
      if (vote === "dislike") current.dislike += 1;
      setReactionCounts(current);

      const res = await fetchJSONP(REACTIONS_ENDPOINT, { post_id: postId, vote });
      if (res && res.ok) {
        localStorage.setItem(key, vote); // store what they picked
        setReactionCounts(res);
      }
    });
  });
}

initReactions();


    /* =========================
       5) Sort post cards on INDEX pages:
          - Pin latest by data-date first
          - Others by views desc
          - Tie-break by date desc
       ========================= */
    const list = document.querySelector(".post-list");
    if (list && !document.body.classList.contains("post-page")) {
      const cards = Array.from(list.querySelectorAll(".post-card"));
      if (cards.length) {
        const items = cards.map((card) => {
          const postId = getPostIdFromCard(card);
          const date = getDateFromCard(card);

          return { card, postId, date, views: 0 };
        });

        // Pinned = most recently published (by data-date)
        const pinned = items.reduce((best, cur) => (cur.date > best.date ? cur : best), items[0]);

        Promise.all(items.map((it) => {
          return fetchViewsJSONP(it.postId).then((v) => {
            it.views = (typeof v === "number") ? v : 0;
            it.card.setAttribute("data-views", String(it.views));
            return it.views;
          });
        })).then(() => {
          const sorted = items.slice().sort((a, b) => {
            // pinned first
            if (a === pinned && b !== pinned) return -1;
            if (b === pinned && a !== pinned) return 1;

            // views desc
            if (b.views !== a.views) return b.views - a.views;

            // date desc
            return b.date - a.date;
          });

          sorted.forEach((it) => list.appendChild(it.card));
        });
      }
    }

    /* =========================
       6) Quick Fit (EN/RU/PL/UA) — matches YOUR HTML
          - root: [data-quick-fit]
          - radios: values with hyphens
          - map links: .quick-fit__link with data-map="classic|platform|tools"
          - ERP blocks: h3[data-erp] ... until next h3[data-erp] or h2
       ========================= */
    const quickFitRoot = document.querySelector("[data-quick-fit]");
    if (!quickFitRoot) return;

    const I18N = {
      en: {
        title: "Short on time?",
        lead: "Most teams don’t evaluate all options equally. They narrow the list down by context:",
        legend: "Pick what sounds closest:",
        opt1: "SMB · stable processes · no in-house dev",
        opt2: "SMB · changing processes · small dev team",
        opt3: "Enterprise · standardized processes",
        opt4: "Enterprise · evolving logic · platform-first approach",
        hint: "If you recognize yourself in one of these, only a small subset of systems in this article usually applies.",
        mapTitle: "Jump to:",
        map1: "Classic ERPs (Odoo, ERPNext, Dolibarr, metasfresh)",
        map2: "Platform-first (lsFusion, Tryton, OFBiz, Openbravo)",
        map3: "Low-code & internal tools (ToolJet, NocoBase, Budibase, Retool)",
        recTitle: "What to focus on:",
        recDefault: "Choose an option above — I’ll highlight the most relevant parts.",
        rec: {
          "smb-stable-no-dev":
            "Start with Classic ERPs first. Avoid heavy customization early; optimize for time-to-value.",
          "smb-changing-small-dev":
            "Look at platform-first options and flexible stacks. You’ll feel “customization debt” earlier than you think.",
          "enterprise-standardized":
            "Classic ERPs can work well when governance is strong. Focus on upgrade path + integration strategy.",
          "enterprise-evolving-platform": 
            "Platform-first approaches fit best when logic must evolve. Prioritize declarative/readable business logic and long-term maintainability."
        }
      },
      ru: {
        title: "Мало времени?",
        lead: "Обычно команды не оценивают весь список одинаково. Сужают выбор по контексту:",
        legend: "Выберите, что ближе всего:",
        opt1: "SMB · стабильные процессы · нет своей разработки",
        opt2: "SMB · процессы часто меняются · небольшая dev-команда",
        opt3: "Enterprise · процессы стандартизированы",
        opt4: "Enterprise · логика эволюционирует · platform-first подход",
        hint: "Если вы узнали себя, обычно подходит лишь небольшая часть систем из этой статьи.",
        mapTitle: "Перейти к:",
        map1: "Классические ERP (Odoo, ERPNext, Dolibarr, metasfresh)",
        map2: "Platform-first (lsFusion, Tryton, OFBiz, Openbravo)",
        map3: "Low-code и internal tools (ToolJet, NocoBase, Budibase, Retool)",
        recTitle: "На что смотреть в первую очередь:",
        recDefault: "Выберите вариант выше — я подсвечу наиболее релевантные части статьи.",
        rec: {
          "smb-stable-no-dev":
            "Начните с классических ERP. На старте избегайте тяжёлой кастомизации — важнее быстро получить пользу.",
          "smb-changing-small-dev":
            "Смотрите platform-first и более гибкие стеки. «Долг кастомизаций» вы почувствуете раньше, чем кажется.",
          "enterprise-standardized":
            "Классические ERP хорошо работают при сильном управлении. Фокус: обновления, интеграции, жизненный цикл.",
          "enterprise-evolving-platform":
            "Platform-first лучше, когда логика должна постоянно меняться. Ставьте в приоритет читаемую/декларативную бизнес-логику и поддерживаемость."
        }
      },
      pl: {
        title: "Mało czasu?",
        lead: "Zespoły rzadko oceniają całą listę jednakowo. Zawężają wybór według kontekstu:",
        legend: "Wybierz, co jest najbliższe:",
        opt1: "SMB · stabilne procesy · brak zespołu dev in-house",
        opt2: "SMB · procesy się zmieniają · mały zespół dev",
        opt3: "Enterprise · procesy ustandaryzowane",
        opt4: "Enterprise · logika ewoluuje · podejście platform-first",
        hint: "Jeśli rozpoznajesz tu swój kontekst, zwykle pasuje tylko niewielka część systemów z tego artykułu.",
        mapTitle: "Przejdź do:",
        map1: "Klasyczne ERP (Odoo, ERPNext, Dolibarr, metasfresh)",
        map2: "Platform-first (lsFusion, Tryton, OFBiz, Openbravo)",
        map3: "Low-code i internal tools (ToolJet, NocoBase, Budibase, Retool)",
        recTitle: "Na czym się skupić:",
        recDefault: "Wybierz opcję powyżej — podświetlę najbardziej pasujące fragmenty.",
        rec: {
          "smb-stable-no-dev":
            "Zacznij od klasycznych ERP. Unikaj ciężkiej customizacji na starcie — liczy się szybka wartość.",
          "smb-changing-small-dev":
            "Spójrz na platform-first i elastyczne podejścia. „Dług customizacji” pojawia się szybciej, niż się wydaje.",
          "enterprise-standardized":
            "Klasyczne ERP działa, gdy governance jest mocny. Skup się na aktualizacjach i strategii integracji.",
          "enterprise-evolving-platform":
            "Platform-first pasuje, gdy logika musi ewoluować. Priorytet: czytelna/deklaratywna logika i utrzymanie w czasie."
        }
      },
      uk: {
        title: "Мало часу?",
        lead: "Зазвичай команди не оцінюють весь список однаково. Вони звужують вибір за контекстом:",
        legend: "Оберіть, що найближче:",
        opt1: "SMB · стабільні процеси · немає in-house розробки",
        opt2: "SMB · процеси змінюються · невелика dev-команда",
        opt3: "Enterprise · процеси стандартизовані",
        opt4: "Enterprise · логіка еволюціонує · platform-first підхід",
        hint: "Якщо ви впізнали себе, зазвичай підходить лише невелика частина систем із цієї статті.",
        mapTitle: "Перейти до:",
        map1: "Класичні ERP (Odoo, ERPNext, Dolibarr, metasfresh)",
        map2: "Platform-first (lsFusion, Tryton, OFBiz, Openbravo)",
        map3: "Low-code та internal tools (ToolJet, NocoBase, Budibase, Retool)",
        recTitle: "На що дивитися в першу чергу:",
        recDefault: "Оберіть варіант вище — я підсвічу найрелевантніші частини статті.",
        rec: {
          "smb-stable-no-dev":
            "Почніть із класичних ERP. На старті уникайте важкої кастомізації — важливіше швидко отримати цінність.",
          "smb-changing-small-dev":
            "Дивіться platform-first та гнучкі підходи. «Борг кастомізації» з’являється раніше, ніж здається.",
          "enterprise-standardized":
            "Класичні ERP працюють, коли governance сильний. Фокус: апгрейди та стратегія інтеграцій.",
          "enterprise-evolving-platform":
            "Platform-first найкраще, коли логіка має постійно змінюватися. Пріоритет: декларативна/читабельна логіка та підтримуваність."
        }
      }
    };

    const dict = I18N[lang] || I18N.en;

    // Apply i18n on elements inside quick-fit only
    quickFitRoot.querySelectorAll("[data-i18n]").forEach((el) => {
      const key = el.getAttribute("data-i18n") || "";
      if (dict[key]) el.textContent = dict[key];
    });

    const recommendText = quickFitRoot.querySelector(".quick-fit__recommend-text");
    const radios = Array.from(quickFitRoot.querySelectorAll('input[type="radio"][name="quickFit"]'));
    const mapLinks = Array.from(quickFitRoot.querySelectorAll(".quick-fit__link"));

    // Map choice -> highlight map links (your HTML uses data-map)
    const choiceToMaps = {
      "smb-stable-no-dev": ["classic"],
      "smb-changing-small-dev": ["platform", "tools"],
      "enterprise-standardized": ["classic"],
      "enterprise-evolving-platform": ["platform"]
    };

    function setActiveMap(mapKeys) {
      mapLinks.forEach((a) => {
        const key = a.getAttribute("data-map") || "";
        a.classList.toggle("is-active", mapKeys.includes(key));
      });
    }

    // ERP fit mapping: matches your h3[data-erp] keys
    const ERP_FIT = {
      odoo: ["smb-stable-no-dev"],
      erpnext: ["smb-stable-no-dev", "enterprise-standardized"],
      dolibarr: ["smb-stable-no-dev"],
      metasfresh: ["enterprise-standardized"],

      lsfusion: ["smb-changing-small-dev", "enterprise-evolving-platform"],
      tryton: ["enterprise-standardized", "enterprise-evolving-platform"],
      ofbiz: ["enterprise-evolving-platform"],
      openbravo: ["enterprise-evolving-platform"],

      tooljet: ["smb-changing-small-dev", "enterprise-evolving-platform"],
      nocobase: ["smb-changing-small-dev", "enterprise-evolving-platform"],
      budibase: ["smb-changing-small-dev"],
      retool: ["smb-changing-small-dev", "enterprise-evolving-platform"]
    };

    // Auto-assign data-fit on headings
    document.querySelectorAll("article [data-erp]").forEach((h3) => {
      const erpKey = (h3.getAttribute("data-erp") || "").toLowerCase();
      const fit = ERP_FIT[erpKey];
      if (!fit) return;
      h3.setAttribute("data-fit", fit.join(" "));
    });

    // Helpers to find "ERP blocks" (from H3 until next H3/H2)
    function getErpBlocks() {
      const blocks = [];
      const headers = Array.from(document.querySelectorAll("article [data-erp]"));
      headers.forEach((h3) => {
        const block = { head: h3, nodes: [h3] };
        let n = h3.nextElementSibling;
        while (n && !n.matches("h3[data-erp], h2")) {
          block.nodes.push(n);
          n = n.nextElementSibling;
        }
        blocks.push(block);
      });
      return blocks;
    }

    const blocks = getErpBlocks();

    function clearHighlight() {
      blocks.forEach((b) => b.nodes.forEach((node) => node.classList.remove("quick-fit--dim", "quick-fit--hit")));
    }

    function applyFilter(selected) {
      if (!recommendText) return;

      if (!selected) {
        recommendText.textContent = dict.recDefault;
        clearHighlight();
        setActiveMap([]);
        return;
      }

      recommendText.textContent = (dict.rec && dict.rec[selected]) ? dict.rec[selected] : dict.recDefault;

      const maps = choiceToMaps[selected] || [];
      setActiveMap(maps);

      blocks.forEach((b) => {
        const fitStr = (b.head.getAttribute("data-fit") || "").trim();
        const fits = fitStr.split(/\s+/).filter(Boolean);
        const hit = fits.includes(selected);

        b.nodes.forEach((node) => {
          node.classList.toggle("quick-fit--hit", hit);
          node.classList.toggle("quick-fit--dim", !hit);
        });
      });

      dlPush({
        event: "quick_fit_select",
        quick_fit_choice: selected,
        content_lang: lang,
        page_path: location.pathname
      });
    }

    radios.forEach((r) => r.addEventListener("change", () => applyFilter(r.value)));

    // Track map clicks
    mapLinks.forEach((a) => {
      a.addEventListener("click", () => {
        dlPush({
          event: "quick_fit_map_click",
          quick_fit_map: a.getAttribute("data-map") || "",
          content_lang: lang,
          page_path: location.pathname,
          link_url: a.getAttribute("href") || ""
        });
      });
    });

    // Start neutral
    applyFilter(null);
  });


})();

(function(){
  const KEY = "dl_consent_v1";

  function detectLang() {
    const host = (location.hostname || "").toLowerCase();
    if (host.startsWith("pl.")) return "pl";
    if (host.startsWith("ru.")) return "ru";
    if (host.startsWith("uk.")) return "uk";
    if (host.startsWith("en.")) return "en";

    const htmlLang = (document.documentElement.getAttribute("lang") || "").toLowerCase();
    if (htmlLang.startsWith("pl")) return "pl";
    if (htmlLang.startsWith("ru")) return "ru";
    if (htmlLang.startsWith("uk") || htmlLang.startsWith("ua")) return "uk";
    if (htmlLang.startsWith("en")) return "en";
    return "en";
  }

  const I18N = {
    en: {
      title: "Analytics preference",
      text: "We use anonymous analytics to improve content and understand outbound link usage.",
      yes: "Analytics only",
      no: "Reject",
      privacy: "Privacy"
    },
    pl: {
      title: "Ustawienia analityki",
      text: "Używamy anonimowej analityki, aby ulepszać treści i rozumieć użycie linków zewnętrznych.",
      yes: "Tylko analityka",
      no: "Odrzuć",
      privacy: "Prywatność"
    },
    ru: {
      title: "Настройка аналитики",
      text: "Мы используем анонимную аналитику, чтобы улучшать контент и понимать клики по внешним ссылкам.",
      yes: "Только аналитика",
      no: "Отклонить",
      privacy: "Политика"
    },
    uk: {
      title: "Налаштування аналітики",
      text: "Ми використовуємо анонімну аналітику, щоб покращувати контент і розуміти кліки по зовнішніх посиланнях.",
      yes: "Лише аналітика",
      no: "Відхилити",
      privacy: "Політика"
    }
  };

  function show(){ document.getElementById("dl-consent-overlay").style.display = "block"; }
  function hide(){ document.getElementById("dl-consent-overlay").style.display = "none"; }

  function setAnalyticsGranted(){
    gtag('consent', 'update', {
      analytics_storage: 'granted',
      ad_storage: 'denied',
      ad_user_data: 'denied',
      ad_personalization: 'denied'
    });
    localStorage.setItem(KEY, "analytics");
  }

  function setDenied(){
    gtag('consent', 'update', {
      analytics_storage: 'denied',
      ad_storage: 'denied',
      ad_user_data: 'denied',
      ad_personalization: 'denied'
    });
    localStorage.setItem(KEY, "denied");
  }

  // inject copy
  const lang = detectLang();
  const t = I18N[lang] || I18N.en;

  document.getElementById("dl-c-title").textContent = t.title;
  document.getElementById("dl-c-text").textContent = t.text;
  document.getElementById("dl-c-analytics").textContent = t.yes;
  document.getElementById("dl-c-reject").textContent = t.no;
  document.getElementById("dl-c-privacy").textContent = t.privacy;

  // enforce choice
  const saved = localStorage.getItem(KEY);
  if (!saved) show();
  else {
    if (saved === "analytics") setAnalyticsGranted();
    else setDenied();
  }

  document.getElementById("dl-c-analytics").addEventListener("click", function(){
    setAnalyticsGranted();
    hide();
  });

  document.getElementById("dl-c-reject").addEventListener("click", function(){
    setDenied();
    hide();
  });

  // no click-outside close (forces choice)
  document.getElementById("dl-consent-overlay").addEventListener("click", function(e){
    if (e.target === this) {
      // do nothing
    }
  });
})();