    // Year in footer
    document.getElementById("year").textContent = new Date().getFullYear();

    // Simple in-page search + tag filter
    const searchInput = document.getElementById("searchInput");
    const posts = Array.from(document.querySelectorAll(".post-card"));
    const tagButtons = Array.from(document.querySelectorAll(".tag"));

    let activeTag = "all";

    function applyFilters() {
      const query = (searchInput.value || "").toLowerCase().trim();

      posts.forEach(post => {
        const text = post.textContent.toLowerCase();
        const tags = (post.getAttribute("data-tags") || "").split(" ");
        const matchesText = !query || text.includes(query);
        const matchesTag = activeTag === "all" || tags.includes(activeTag);
        post.style.display = (matchesText && matchesTag) ? "" : "none";
      });
    }

    if (searchInput) {
      searchInput.addEventListener("input", applyFilters);
    }

    tagButtons.forEach(btn => {
      btn.addEventListener("click", () => {
        tagButtons.forEach(b => b.classList.remove("active"));
        btn.classList.add("active");
        activeTag = btn.getAttribute("data-tag");
        applyFilters();
      });
    });
// js/scripts.js

document.addEventListener("DOMContentLoaded", () => {
  const body = document.body;
  if (!body.classList.contains("post-page")) return;

  const article = document.querySelector("article");
  if (!article) return;

  // 1) Определяем / создаем id для статьи
  let postId = article.id;
  if (!postId) {
    const path = window.location.pathname;
    const filename = path.split("/").filter(Boolean).pop() || "";
    postId = filename.replace(/\.html?$/i, "") || "post-unknown";
    article.id = postId;
  }

  // 2) Добавляем блок просмотров под существующим footer статьи
  let footer = article.querySelector("footer");
  if (!footer) {
    footer = document.createElement("footer");
    footer.className = "post-footer";
    article.appendChild(footer);
  }

  let viewsBlock = article.querySelector(".post-views");
  if (!viewsBlock) {
    viewsBlock = document.createElement("div");
    viewsBlock.className = "post-views";
    viewsBlock.dataset.key = postId;
    viewsBlock.innerHTML = `
      <span class="label">Views:</span>
      <span class="count">—</span>
    `;
    footer.appendChild(viewsBlock);
  }

  const key = viewsBlock.dataset.key || postId;
  const url = `https://api.countapi.xyz/hit/devlab.blog/${encodeURIComponent(
    key
  )}`;

  // 3) Дергаем API для счетчика просмотров
  fetch(url)
    .then((res) => res.json())
    .then((data) => {
      if (!data || typeof data.value === "undefined") return;
      viewsBlock.querySelector(".count").textContent = data.value;
    })
    .catch(() => {
      // тихо падаем, ничего не ломаем
    });
});

