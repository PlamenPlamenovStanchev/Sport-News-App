// src/pages/create-news.js
// -------------------------
// Handles the Create News form on pages/create-news.html.
// Only accessible to users with the "author" role.

import { requireRole } from "../utils/auth.js";
import { createNews } from "../services/newsService.js";

const errorMessage = document.getElementById("errorMessage");
const successMessage = document.getElementById("successMessage");
const form = document.getElementById("createNewsForm");

// Guard: redirect non-authors
const profile = await requireRole(["author", "admin"]);

form.addEventListener("submit", async (e) => {
  e.preventDefault();

  errorMessage.classList.add("d-none");
  successMessage.classList.add("d-none");

  const article = {
    title: document.getElementById("title").value.trim(),
    sport_tag: document.getElementById("sportTag").value,
    image_url: document.getElementById("imageUrl").value.trim() || null,
    content: document.getElementById("content").value.trim(),
    author_id: profile.id,
    // status is set to "pending" inside newsService.createNews
  };

  const { error } = await createNews(article);

  if (error) {
    errorMessage.textContent = error.message;
    errorMessage.classList.remove("d-none");
    return;
  }

  successMessage.textContent = "Article submitted! It will be reviewed by an editor.";
  successMessage.classList.remove("d-none");
  form.reset();
});
