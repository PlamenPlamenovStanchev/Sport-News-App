// src/pages/home.js
// ------------------
// Page module for index.html (Home page).
// Responsibilities:
//   - Fetch and display approved news cards
//   - Handle sport tag filter
//   - Handle title search
//   - Handle pagination

import { fetchApprovedNews, fetchCategories } from "../services/newsService.js";
import { initNavbar } from "../utils/navbar.js";

// ─── State ───────────────────────────────────────────────────────────────────

const state = {
  currentPage: 1,
  limit: 6,
  selectedCategory: "all",
  searchQuery: "",
};

// ─── DOM References ───────────────────────────────────────────────────────────

const newsGrid       = document.getElementById("newsGrid");
const pagination     = document.getElementById("pagination");
const searchInput    = document.getElementById("searchInput");
const categoryFilters = document.getElementById("categoryFilters");

// ─── Init ─────────────────────────────────────────────────────────────────────

initNavbar();
if (window.lucide) window.lucide.createIcons();
await loadCategories();
loadNews();

// ─── Event Listeners ──────────────────────────────────────────────────────────

// Search: trigger on input with a small debounce
let debounceTimer;
searchInput.addEventListener("input", () => {
  clearTimeout(debounceTimer);
  debounceTimer = setTimeout(() => {
    state.searchQuery = searchInput.value;
    state.currentPage = 1;
    loadNews();
  }, 400);
});

/**
 * Fetch categories from DB and render filter buttons dynamically.
 */
async function loadCategories() {
  const { data: categories } = await fetchCategories();
  if (!categories) return;

  const allBtn = `<button class="category-pill active" data-category="all">All</button>`;
  const catBtns = categories
    .map((c) => `<button class="category-pill" data-category="${c.id}">${escapeHtml(c.name)}</button>`)
    .join("");

  categoryFilters.innerHTML = allBtn + catBtns;

  // Attach click handlers
  categoryFilters.querySelectorAll("button[data-category]").forEach((btn) => {
    btn.addEventListener("click", () => {
      categoryFilters.querySelectorAll("button").forEach((b) => {
        b.classList.remove("active");
      });
      btn.classList.add("active");

      state.selectedCategory = btn.dataset.category;
      state.currentPage = 1;
      loadNews();
    });
  });
}

// ─── Core Functions ───────────────────────────────────────────────────────────

/**
 * Fetch news from the service and render cards + pagination.
 */
async function loadNews() {
  newsGrid.innerHTML = `
    <div class="col-12 loading-spinner">
      <div class="spinner-border" role="status">
        <span class="visually-hidden">Loading…</span>
      </div>
      <span>Loading news…</span>
    </div>`;
  pagination.innerHTML = "";

  const { data: articles, count, error } = await fetchApprovedNews({
    page: state.currentPage,
    limit: state.limit,
    category: state.selectedCategory,
    search: state.searchQuery,
  });

  if (error) {
    newsGrid.innerHTML = `<div class="col-12 text-center text-danger">Failed to load news. Please try again.</div>`;
    console.error("fetchApprovedNews error:", error.message);
    return;
  }

  renderNewsCards(articles);
  renderPagination(count);
}

/**
 * Build and inject Bootstrap news cards into the grid.
 *
 * @param {object[]} articles
 */
function renderNewsCards(articles) {
  if (!articles || articles.length === 0) {
    newsGrid.innerHTML = `<div class="col-12 text-center text-muted py-5"><i data-lucide="inbox" style="width:48px;height:48px;" class="mb-3 d-block mx-auto opacity-50"></i>No news articles found.</div>`;
    if (window.lucide) window.lucide.createIcons();
    return;
  }

  newsGrid.innerHTML = articles
    .map(
      (article, index) => `
        <div class="col-sm-6 col-lg-4">
          <a href="/pages/news-details.html?id=${article.id}" class="text-decoration-none text-reset">
            <div class="card h-100 card-animated card-clickable" style="animation-delay: ${index * 0.07}s;">
              <div style="overflow:hidden;">
                <img
                  src="${article.image_url || "https://placehold.co/600x300?text=No+Image"}"
                  class="card-img-top"
                  alt="${escapeHtml(article.title)}"
                  style="height: 200px; object-fit: cover;"
                />
              </div>
              <div class="card-body d-flex flex-column">
                <span class="badge badge-category mb-2" style="align-self:flex-start;">${escapeHtml(article.categories?.name ?? "")}</span>
                <h5 class="card-title">${escapeHtml(article.title)}</h5>
                ${article.profiles?.username ? `<p class="text-muted small mb-1"><i data-lucide="pen-tool" class="icon-sm"></i> ${escapeHtml(article.profiles.username)}</p>` : ""}
                <div class="card-stats mt-auto">
                  <span title="Likes"><i data-lucide="heart" class="icon-sm"></i> ${article.article_likes?.[0]?.count ?? 0}</span>
                  <span title="Views"><i data-lucide="eye" class="icon-sm"></i> ${article.article_views?.[0]?.count ?? 0}</span>
                  <span title="Date"><i data-lucide="calendar" class="icon-sm"></i> ${formatDate(article.created_at)}</span>
                  <span title="Comments"><i data-lucide="message-circle" class="icon-sm"></i> ${article.comments?.[0]?.count ?? 0}</span>
                </div>
                <span class="btn btn-read-more mt-3">Read More <i data-lucide="arrow-right"></i></span>
              </div>
            </div>
          </a>
        </div>
      `
    )
    .join("");

  // Render Lucide icons inside dynamically created cards
  if (window.lucide) window.lucide.createIcons();
}

/**
 * Build Bootstrap pagination controls.
 *
 * @param {number} totalCount - Total number of matching articles.
 */
function renderPagination(totalCount) {
  const totalPages = Math.ceil(totalCount / state.limit);

  if (totalPages <= 1) return;

  const items = [];

  // Previous button
  items.push(`
    <li class="page-item ${state.currentPage === 1 ? "disabled" : ""}">
      <button class="page-link" data-page="${state.currentPage - 1}">&laquo;</button>
    </li>
  `);

  // Page numbers
  for (let i = 1; i <= totalPages; i++) {
    items.push(`
      <li class="page-item ${i === state.currentPage ? "active" : ""}">
        <button class="page-link" data-page="${i}">${i}</button>
      </li>
    `);
  }

  // Next button
  items.push(`
    <li class="page-item ${state.currentPage === totalPages ? "disabled" : ""}">
      <button class="page-link" data-page="${state.currentPage + 1}">&raquo;</button>
    </li>
  `);

  pagination.innerHTML = items.join("");

  // Attach click handlers
  pagination.querySelectorAll("button[data-page]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const page = parseInt(btn.dataset.page, 10);
      if (page < 1 || page > totalPages) return;
      state.currentPage = page;
      loadNews();
      window.scrollTo({ top: 0, behavior: "smooth" });
    });
  });
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Prevent XSS by escaping HTML special characters.
 *
 * @param {string} str
 * @returns {string}
 */
function escapeHtml(str) {
  const div = document.createElement("div");
  div.textContent = str;
  return div.innerHTML;
}

/**
 * Format an ISO date string to a readable format.
 *
 * @param {string} isoString
 * @returns {string}
 */
function formatDate(isoString) {
  return new Date(isoString).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}
