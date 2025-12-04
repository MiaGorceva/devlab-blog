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
