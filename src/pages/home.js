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

  const allBtn = `<button class="btn btn-dark btn-sm active" data-category="all">All</button>`;
  const catBtns = categories
    .map((c) => `<button class="btn btn-outline-dark btn-sm" data-category="${escapeHtml(c.name)}">${escapeHtml(c.name)}</button>`)
    .join("");

  categoryFilters.innerHTML = allBtn + catBtns;

  // Attach click handlers
  categoryFilters.querySelectorAll("button[data-category]").forEach((btn) => {
    btn.addEventListener("click", () => {
      categoryFilters.querySelectorAll("button").forEach((b) => {
        b.classList.remove("btn-dark", "active");
        b.classList.add("btn-outline-dark");
      });
      btn.classList.remove("btn-outline-dark");
      btn.classList.add("btn-dark", "active");

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
  newsGrid.innerHTML = `<div class="col-12 text-center text-muted">Loading news...</div>`;
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
    newsGrid.innerHTML = `<div class="col-12 text-center text-muted">No news articles found.</div>`;
    return;
  }

  newsGrid.innerHTML = articles
    .map(
      (article) => `
        <div class="col-sm-6 col-lg-4">
          <div class="card h-100 shadow-sm">
            <img
              src="${article.image_url || "https://placehold.co/600x300?text=No+Image"}"
              class="card-img-top"
              alt="${escapeHtml(article.title)}"
              style="height: 200px; object-fit: cover;"
            />
            <div class="card-body d-flex flex-column">
              <span class="badge bg-secondary mb-2">${escapeHtml(article.categories?.name ?? "")}</span>
              <h5 class="card-title">${escapeHtml(article.title)}</h5>
              <p class="text-muted small mt-auto">${formatDate(article.created_at)}</p>
              <a
                href="/pages/news-details.html?id=${article.id}"
                class="btn btn-dark btn-sm mt-2"
              >Read More</a>
            </div>
          </div>
        </div>
      `
    )
    .join("");
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
