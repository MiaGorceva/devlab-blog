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

(() => {
  // ---- 1) Detect language (subdomain / HTML lang / fallback EN)
  const host = location.hostname || "";
  const htmlLang = (document.documentElement.getAttribute("lang") || "").toLowerCase();

  function detectLang() {
    // en.devlab.blog | ru.devlab.blog | pl.devlab.blog | uk.devlab.blog (UA)
    if (host.startsWith("ru.")) return "ru";
    if (host.startsWith("pl.")) return "pl";
    if (host.startsWith("uk.")) return "ua";
    if (host.startsWith("en.")) return "en";
    if (htmlLang.startsWith("ru")) return "ru";
    if (htmlLang.startsWith("pl")) return "pl";
    if (htmlLang.startsWith("uk") || htmlLang.startsWith("ua")) return "ua";
    return "en";
  }

  const lang = detectLang();

  // ---- 2) i18n strings
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
      mapTitle: "Quick map:",
      map1: "Classic ERPs → sections 1–2",
      map2: "Platform-first systems → section 3",
      map3: "Low-code & internal tools → section 4",
      recTitle: "What to focus on:",
      recDefault: "Choose an option above — I’ll highlight the most relevant section(s).",
      rec: {
        smb_stable_no_dev: "Start with Classic ERPs first. Avoid heavy customization early; optimize for time-to-value.",
        smb_change_small_dev: "Look at platform-first options and flexible stacks. You’ll feel “customization debt” earlier than you think.",
        ent_standardized: "Classic ERPs can work well when governance is strong. Focus on upgrade path + integration strategy.",
        ent_platform: "Platform-first approaches fit best when logic must evolve. Prioritize declarative/readable business logic and long-term maintainability."
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
      mapTitle: "Быстрая карта:",
      map1: "Классические ERP → разделы 1–2",
      map2: "Platform-first системы → раздел 3",
      map3: "Low-code и internal tools → раздел 4",
      recTitle: "На что смотреть в первую очередь:",
      recDefault: "Выберите вариант выше — я подсвечу наиболее релевантные части статьи.",
      rec: {
        smb_stable_no_dev: "Начните с классических ERP. На старте избегайте тяжёлой кастомизации — важнее быстро получить пользу.",
        smb_change_small_dev: "Смотрите platform-first и более гибкие стеки. «Долг кастомизаций» вы почувствуете раньше, чем кажется.",
        ent_standardized: "Классические ERP хорошо работают при сильном управлении. Фокус: обновления, интеграции, жизненный цикл.",
        ent_platform: "Platform-first лучше, когда логика должна постоянно меняться. Ставьте в приоритет читаемую/декларативную бизнес-логику и поддерживаемость."
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
      mapTitle: "Szybka mapa:",
      map1: "Klasyczne ERP → sekcje 1–2",
      map2: "Platform-first → sekcja 3",
      map3: "Low-code i narzędzia wewnętrzne → sekcja 4",
      recTitle: "Na czym się skupić:",
      recDefault: "Wybierz opcję powyżej — podświetlę najbardziej pasujące fragmenty.",
      rec: {
        smb_stable_no_dev: "Zacznij od klasycznych ERP. Unikaj ciężkiej customizacji na starcie — liczy się szybka wartość.",
        smb_change_small_dev: "Spójrz na platform-first i elastyczne podejścia. „Dług customizacji” pojawia się szybciej, niż się wydaje.",
        ent_standardized: "Klasyczne ERP działa, gdy governance jest mocny. Skup się na aktualizacjach i strategii integracji.",
        ent_platform: "Platform-first pasuje, gdy logika musi ewoluować. Priorytet: czytelna/deklaratywna logika i utrzymanie w czasie."
      }
    },
    ua: {
      title: "Мало часу?",
      lead: "Зазвичай команди не оцінюють весь список однаково. Вони звужують вибір за контекстом:",
      legend: "Оберіть, що найближче:",
      opt1: "SMB · стабільні процеси · немає in-house розробки",
      opt2: "SMB · процеси змінюються · невелика dev-команда",
      opt3: "Enterprise · процеси стандартизовані",
      opt4: "Enterprise · логіка еволюціонує · platform-first підхід",
      hint: "Якщо ви впізнали себе, зазвичай підходить лише невелика частина систем із цієї статті.",
      mapTitle: "Швидка карта:",
      map1: "Класичні ERP → розділи 1–2",
      map2: "Platform-first → розділ 3",
      map3: "Low-code та internal tools → розділ 4",
      recTitle: "На що дивитися в першу чергу:",
      recDefault: "Оберіть варіант вище — я підсвічу найрелевантніші частини статті.",
      rec: {
        smb_stable_no_dev: "Почніть із класичних ERP. На старті уникайте важкої кастомізації — важливіше швидко отримати цінність.",
        smb_change_small_dev: "Дивіться platform-first та гнучкі підходи. «Борг кастомізації» з’являється раніше, ніж здається.",
        ent_standardized: "Класичні ERP працюють, коли governance сильний. Фокус: апгрейди та стратегія інтеграцій.",
        ent_platform: "Platform-first найкраще, коли логіка має постійно змінюватися. Пріоритет: декларативна/читабельна логіка та підтримуваність."
      }
    }
  };

  function applyI18n() {
    const dict = I18N[lang] || I18N.en;
    document.querySelectorAll("[data-i18n]").forEach(el => {
      const key = el.getAttribute("data-i18n");
      if (!key) return;
      // Nested keys are handled in recommend part only.
      if (dict[key]) el.textContent = dict[key];
    });
  }

  // ---- 3) Analytics helpers (GTM/GA4)
  function dlPush(payload) {
    window.dataLayer = window.dataLayer || [];
    window.dataLayer.push(payload);
  }

  // ---- 4) Behavior: pick option -> highlight + recommend text + optional focus jump targets
  const block = document.querySelector(".quick-fit");
  if (!block) return;

  const recommendText = block.querySelector(".quick-fit__recommend-text");
  const radios = block.querySelectorAll('input[type="radio"][name="quickFit"]');
  const links = block.querySelectorAll(".quick-fit__link");

  // Map choices to which section link(s) to emphasize
  // NOTE: Update href anchors to match your actual headings IDs.
  const choiceToSections = {
    smb_stable_no_dev: ["classic"],
    smb_change_small_dev: ["platform", "tools"],
    ent_standardized: ["classic"],
    ent_platform: ["platform"]
  };

  function setActiveSections(sectionKeys) {
    links.forEach(a => {
      const key = a.getAttribute("data-section");
      a.classList.toggle("is-active", sectionKeys.includes(key));
    });
  }

  function onSelect(value) {
    const dict = I18N[lang] || I18N.en;
    const text = (dict.rec && dict.rec[value]) ? dict.rec[value] : dict.recDefault;

    if (recommendText) recommendText.textContent = text;

    const sections = choiceToSections[value] || [];
    setActiveSections(sections);

    dlPush({
      event: "quick_fit_select",
      quick_fit_choice: value,
      content_lang: lang,
      page_path: location.pathname
    });
  }

  radios.forEach(r => {
    r.addEventListener("change", () => onSelect(r.value));
  });

  // Track map clicks
  links.forEach(a => {
    a.addEventListener("click", () => {
      dlPush({
        event: "quick_fit_map_click",
        quick_fit_section: a.getAttribute("data-section") || "",
        content_lang: lang,
        page_path: location.pathname,
        link_url: a.getAttribute("href") || ""
      });
    });
  });

  // Apply i18n on load
  applyI18n();


})();
(function () {
  const root = document.querySelector('[data-quick-fit]');
  if (!root) return;

  // 1) Fit mapping (auto-assign data-fit by ERP)
  const ERP_FIT = {
    "odoo": ["smb-stable-no-dev"],
    "erpnext": ["smb-stable-no-dev", "enterprise-standardized"],

    "mycompany-lsfusion": ["smb-changing-small-dev", "enterprise-evolving-platform"],
    "tryton": ["enterprise-standardized", "enterprise-evolving-platform"],
    "ofbiz": ["enterprise-evolving-platform"],

    "tooljet": ["smb-changing-small-dev", "enterprise-evolving-platform"],
    "nocobase": ["smb-changing-small-dev", "enterprise-evolving-platform"],
    "budibase": ["smb-changing-small-dev"]
  };

  // 2) i18n dictionary (4 languages). Auto-detect by host or <html lang="">
  const LANG = (document.documentElement.lang || "").toLowerCase();
  const host = location.hostname.toLowerCase();
  const detected =
    host.startsWith("ru.") ? "ru" :
    host.startsWith("pl.") ? "pl" :
    host.startsWith("uk.") ? "uk" :
    (LANG.startsWith("ru") ? "ru" : LANG.startsWith("pl") ? "pl" : LANG.startsWith("uk") ? "uk" : "en");

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
      map1: "Classic ERPs (Odoo, ERPNext)",
      map2: "Platform-first (lsFusion, Tryton, OFBiz)",
      map3: "Low-code & internal tools (ToolJet, NocoBase, Budibase)",
      recTitle: "What to focus on:",
      recDefault: "Choose an option above — I’ll highlight the most relevant systems.",
      rec: {
        "smb-stable-no-dev": "Start with Odoo and ERPNext. Prioritize clean implementation and avoid heavy customization early.",
        "smb-changing-small-dev": "Look at lsFusion + internal tools (ToolJet/NocoBase/Budibase). You’ll trade “out-of-the-box” for adaptability.",
        "enterprise-standardized": "ERPNext + Tryton are worth attention. Standardize processes first, then choose the system.",
        "enterprise-evolving-platform": "lsFusion / Tryton / OFBiz (+ internal tools) fit best when business logic is evolving and ownership matters."
      }
    },

    ru: {
      title: "Нет времени читать всё?",
      lead: "Большинство команд не оценивают все варианты одинаково. Обычно список сужают по контексту:",
      legend: "Что ближе всего про вас?",
      opt1: "SMB · стабильные процессы · нет своей разработки",
      opt2: "SMB · процессы меняются · маленькая dev-команда",
      opt3: "Enterprise · процессы стандартизированы",
      opt4: "Enterprise · логика эволюционирует · platform-first подход",
      hint: "Если вы узнали себя — обычно подходит только небольшая часть систем из статьи.",
      mapTitle: "Перейти к:",
      map1: "Классические ERP (Odoo, ERPNext)",
      map2: "Platform-first (lsFusion, Tryton, OFBiz)",
      map3: "Low-code / внутренние инструменты (ToolJet, NocoBase, Budibase)",
      recTitle: "На что смотреть:",
      recDefault: "Выберите вариант выше — я подсвечу наиболее релевантные системы.",
      rec: {
        "smb-stable-no-dev": "Смотрите Odoo и ERPNext. Делайте аккуратное внедрение и не уходите в тяжёлую кастомизацию на старте.",
        "smb-changing-small-dev": "Смотрите lsFusion + internal tools (ToolJet/NocoBase/Budibase). Это про адаптивность вместо «всё из коробки».",
        "enterprise-standardized": "Смотрите ERPNext + Tryton. Сначала стандартизируйте процессы, потом выбирайте систему.",
        "enterprise-evolving-platform": "Лучше всего подходят lsFusion / Tryton / OFBiz (+ internal tools), когда логика постоянно меняется и важна управляемость."
      }
    },

    pl: {
      title: "Mało czasu?",
      lead: "Większość zespołów nie ocenia wszystkich opcji jednakowo. Zwykle zawężają listę według kontekstu:",
      legend: "Wybierz, co pasuje najbardziej:",
      opt1: "SMB · stabilne procesy · brak zespołu dev",
      opt2: "SMB · zmienne procesy · mały zespół dev",
      opt3: "Enterprise · procesy ustandaryzowane",
      opt4: "Enterprise · ewoluująca logika · podejście platform-first",
      hint: "Jeśli rozpoznajesz się w jednym z wariantów, zwykle pasuje tylko mały podzbiór systemów z artykułu.",
      mapTitle: "Przejdź do:",
      map1: "Klasyczne ERP (Odoo, ERPNext)",
      map2: "Platform-first (lsFusion, Tryton, OFBiz)",
      map3: "Low-code i narzędzia wewnętrzne (ToolJet, NocoBase, Budibase)",
      recTitle: "Na czym się skupić:",
      recDefault: "Wybierz opcję powyżej — podświetlę najbardziej trafne systemy.",
      rec: {
        "smb-stable-no-dev": "Zacznij od Odoo i ERPNext. Postaw na czyste wdrożenie i unikaj ciężkiej kastomizacji na początku.",
        "smb-changing-small-dev": "Spójrz na lsFusion + narzędzia (ToolJet/NocoBase/Budibase). To wymiana „out-of-the-box” na elastyczność.",
        "enterprise-standardized": "Warto rozważyć ERPNext + Tryton. Najpierw standaryzacja procesów, potem wybór systemu.",
        "enterprise-evolving-platform": "Najlepiej pasują lsFusion / Tryton / OFBiz (+ narzędzia), gdy logika się zmienia i liczy się kontrola."
      }
    },

    uk: {
      title: "Мало часу?",
      lead: "Більшість команд не оцінюють усі варіанти однаково. Зазвичай список звужують за контекстом:",
      legend: "Оберіть, що найближче:",
      opt1: "SMB · стабільні процеси · немає in-house dev",
      opt2: "SMB · процеси змінюються · маленька dev-команда",
      opt3: "Enterprise · стандартизовані процеси",
      opt4: "Enterprise · логіка еволюціонує · platform-first підхід",
      hint: "Якщо ви впізнали себе — зазвичай підходить лише невелика частина систем зі статті.",
      mapTitle: "Перейти до:",
      map1: "Класичні ERP (Odoo, ERPNext)",
      map2: "Platform-first (lsFusion, Tryton, OFBiz)",
      map3: "Low-code та внутрішні інструменти (ToolJet, NocoBase, Budibase)",
      recTitle: "На що дивитись:",
      recDefault: "Оберіть варіант вище — я підсвічу найрелевантніші системи.",
      rec: {
        "smb-stable-no-dev": "Почніть з Odoo та ERPNext. Сфокусуйтеся на чистому впровадженні й не ускладнюйте кастомізацією на старті.",
        "smb-changing-small-dev": "Дивіться lsFusion + інструменти (ToolJet/NocoBase/Budibase). Це про адаптивність замість «з коробки».",
        "enterprise-standardized": "Варто розглянути ERPNext + Tryton. Спершу стандартизація процесів, потім вибір системи.",
        "enterprise-evolving-platform": "Найкраще підходять lsFusion / Tryton / OFBiz (+ інструменти), коли логіка змінюється й важливий контроль."
      }
    }
  };

  // Apply i18n
  const dict = I18N[detected] || I18N.en;
  root.querySelectorAll('[data-i18n]').forEach(el => {
    const key = el.getAttribute('data-i18n');
    if (dict[key]) el.textContent = dict[key];
  });

  // Auto-assign data-fit on headings with data-erp
  document.querySelectorAll('[data-erp]').forEach(h3 => {
    const erpKey = h3.getAttribute('data-erp');
    const fit = ERP_FIT[erpKey];
    if (!fit) return;
    h3.setAttribute('data-fit', fit.join(' '));
    // Mark the entire card/section if you later wrap it (fallback: parent until next H3)
    h3.classList.add('quick-fit__item');
  });

  // Helpers to find "ERP blocks" (from H3 until next H3/H2)
  function getErpBlocks() {
    const blocks = [];
    const headers = Array.from(document.querySelectorAll('article [data-erp]'));
    headers.forEach(h3 => {
      const block = { head: h3, nodes: [h3] };
      let n = h3.nextElementSibling;
      while (n && !n.matches('h3[data-erp], h2')) {
        block.nodes.push(n);
        n = n.nextElementSibling;
      }
      blocks.push(block);
    });
    return blocks;
  }

  const blocks = getErpBlocks();
  const recEl = root.querySelector('.quick-fit__recommend-text');

  function clearHighlight() {
    blocks.forEach(b => b.nodes.forEach(node => node.classList.remove('quick-fit--dim', 'quick-fit--hit')));
  }

  function applyFilter(selected) {
    if (!selected) {
      recEl.textContent = dict.recDefault;
      clearHighlight();
      return;
    }

    // Update recommendation text
    recEl.textContent = (dict.rec && dict.rec[selected]) ? dict.rec[selected] : dict.recDefault;

    blocks.forEach(b => {
      const fitStr = (b.head.getAttribute('data-fit') || '').trim();
      const fits = fitStr.split(/\s+/).filter(Boolean);
      const hit = fits.includes(selected);

      b.nodes.forEach(node => {
        node.classList.toggle('quick-fit--hit', hit);
        node.classList.toggle('quick-fit--dim', !hit);
      });
    });

    // GA4 event (optional, safe)
    if (typeof window.gtag === 'function') {
      window.gtag('event', 'quick_fit_select', { fit: selected, lang: detected });
    }
  }

  // Wire radios
  root.querySelectorAll('input[name="quickFit"]').forEach(r => {
    r.addEventListener('change', () => applyFilter(r.value));
  });

  // Start in neutral state
  applyFilter(null);
})();

