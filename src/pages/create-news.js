// src/pages/create-news.js
// -------------------------
// Handles the Create News form on pages/create-news.html.
// Only accessible to users with the "author" role.

import { requireRole } from "../utils/auth.js";
import { createNews, uploadArticleImage, fetchCategories } from "../services/newsService.js";

// Initialize Lucide icons
if (window.lucide) window.lucide.createIcons();

const errorMessage = document.getElementById("errorMessage");
const successMessage = document.getElementById("successMessage");
const form = document.getElementById("createNewsForm");

// Guard: redirect non-authors
const profile = await requireRole(["author", "admin"]);

// Initialize Lucide icons
if (window.lucide) window.lucide.createIcons();

// Populate categories dropdown (if it exists on the page)
const categorySelect = document.getElementById("newsCategory");
if (categorySelect) {
  const { data: categories } = await fetchCategories();
  if (categories) {
    categories.forEach((cat) => {
      const opt = document.createElement("option");
      opt.value = cat.id;
      opt.textContent = cat.name;
      categorySelect.appendChild(opt);
    });
  }
}

form.addEventListener("submit", async (e) => {
  e.preventDefault();

  errorMessage.classList.add("d-none");
  successMessage.classList.add("d-none");

  const title      = document.getElementById("title").value.trim();
  const categoryId = categorySelect?.value || null;
  const content    = document.getElementById("content").value.trim();
  const imageFile  = document.getElementById("newsImage")?.files[0];

  // Upload image if provided
  let imageUrl = null;
  if (imageFile) {
    const { url, error: uploadError } = await uploadArticleImage(imageFile);
    if (uploadError) {
      errorMessage.textContent = "Image upload failed: " + uploadError.message;
      errorMessage.classList.remove("d-none");
      return;
    }
    imageUrl = url;
  }

  const article = {
    title,
    content,
    image_url: imageUrl,
    category_id: categoryId,
    author_id: profile.id,
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
