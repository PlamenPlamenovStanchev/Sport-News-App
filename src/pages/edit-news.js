// src/pages/edit-news.js
// -----------------------
// Pre-fills the edit form with existing article data and saves changes.
// Reads the article ID from URL: ?id=<uuid>
// Accessible to admins and editors.

import { requireRole } from "../utils/auth.js";
import { fetchNewsById, updateNews } from "../services/newsService.js";

const errorMessage = document.getElementById("errorMessage");
const successMessage = document.getElementById("successMessage");
const form = document.getElementById("editNewsForm");

// Guard: only admin / editor
await requireRole(["admin", "editor"]);

const params = new URLSearchParams(window.location.search);
const newsId = params.get("id");

if (!newsId) {
  errorMessage.textContent = "No article ID provided.";
  errorMessage.classList.remove("d-none");
  form.classList.add("d-none");
} else {
  await loadArticle();
}

// ─── Pre-fill form ────────────────────────────────────────────────────────────

async function loadArticle() {
  const { data: article, error } = await fetchNewsById(newsId);

  if (error || !article) {
    errorMessage.textContent = "Article not found.";
    errorMessage.classList.remove("d-none");
    form.classList.add("d-none");
    return;
  }

  document.getElementById("title").value = article.title;
  document.getElementById("sportTag").value = article.sport_tag;
  document.getElementById("imageUrl").value = article.image_url ?? "";
  document.getElementById("content").value = article.content;
}

// ─── Save Changes ─────────────────────────────────────────────────────────────

form.addEventListener("submit", async (e) => {
  e.preventDefault();

  errorMessage.classList.add("d-none");
  successMessage.classList.add("d-none");

  const fields = {
    title: document.getElementById("title").value.trim(),
    sport_tag: document.getElementById("sportTag").value,
    image_url: document.getElementById("imageUrl").value.trim() || null,
    content: document.getElementById("content").value.trim(),
  };

  const { error } = await updateNews(newsId, fields);

  if (error) {
    errorMessage.textContent = error.message;
    errorMessage.classList.remove("d-none");
    return;
  }

  successMessage.textContent = "Article updated successfully!";
  successMessage.classList.remove("d-none");
});
