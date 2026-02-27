// src/pages/profile.js
// ---------------------
// Displays the logged-in user's profile information and favorite articles.
// URL: /profile/
//
// Behaviour:
//   · Unauthenticated users are redirected to /login
//   · Logout button signs out and redirects to /

import { requireAuth, getCurrentProfile, logout } from "../utils/auth.js";
import { initNavbar } from "../utils/navbar.js";
import { supabase } from "../services/supabaseClient.js";
import { createNews, uploadArticleImage, fetchCategories, fetchMyArticles } from "../services/newsService.js";

// ─── Auth Guard ───────────────────────────────────────────────────────────────
// requireAuth() redirects to /login if the user is not logged in.

const user         = await requireAuth();
const { profile }  = await getCurrentProfile();

// ─── Navbar ───────────────────────────────────────────────────────────────────

await initNavbar();

// ─── Reveal profile content ───────────────────────────────────────────────────

document.getElementById("profileLoading").classList.add("d-none");
document.getElementById("profileContent").classList.remove("d-none");

// ─── Fill in user details ─────────────────────────────────────────────────────

const username = profile?.username ?? user.email.split("@")[0];
const initial  = username.charAt(0).toUpperCase();

document.getElementById("profileAvatar").textContent   = initial;
document.getElementById("profileUsername").textContent = username;
document.getElementById("profileEmail").textContent    = user.email;
document.getElementById("profileRole").textContent     = profile?.role ?? "user";

// ─── Logout button ────────────────────────────────────────────────────────────
// logout() calls supabase.auth.signOut() then redirects to /

document.getElementById("logoutBtn").addEventListener("click", logout);

// ─── Author: Show "Add News" button ──────────────────────────────────────────

if (profile?.role === "author" || profile?.role === "admin") {
  document.getElementById("addNewsBtn").classList.remove("d-none");
  await initCreateNewsModal(user);
  await loadMyArticles(user.id);
}

/**
 * Fetch and render the author's own articles with status badges.
 */
async function loadMyArticles(authorId) {
  const section   = document.getElementById("myArticlesSection");
  const list      = document.getElementById("myArticlesList");
  const noArticles = document.getElementById("noArticles");

  section.classList.remove("d-none");

  const { data: articles, error: articlesError } = await fetchMyArticles(authorId);

  if (articlesError) {
    console.error("My articles error:", articlesError.message);
    return;
  }

  if (!articles || articles.length === 0) {
    noArticles.classList.remove("d-none");
    return;
  }

  list.innerHTML = `
    <div class="table-responsive">
      <table class="table table-hover align-middle">
        <thead class="table-dark">
          <tr>
            <th>Image</th>
            <th>Title</th>
            <th>Category</th>
            <th>Status</th>
            <th>Created</th>
          </tr>
        </thead>
        <tbody>
          ${articles.map((a) => {
            const statusBadge = a.is_published
              ? '<span class="badge bg-success">Approved</span>'
              : '<span class="badge bg-warning text-dark">Pending</span>';
            const date = new Date(a.created_at).toLocaleDateString("en-GB", {
              day: "numeric", month: "short", year: "numeric",
            });
            return `
              <tr>
                <td style="width:80px;">
                  <img src="${a.image_url || 'https://placehold.co/80x50?text=No+Img'}"
                       alt="${escapeHtml(a.title)}" class="rounded"
                       style="width:80px;height:50px;object-fit:cover;" />
                </td>
                <td>
                  <a href="/pages/news-details.html?id=${a.id}" class="text-decoration-none fw-semibold">
                    ${escapeHtml(a.title)}
                  </a>
                </td>
                <td>${escapeHtml(a.categories?.name ?? '—')}</td>
                <td>${statusBadge}</td>
                <td class="text-muted small">${date}</td>
              </tr>
            `;
          }).join("")}
        </tbody>
      </table>
    </div>
  `;
}

/**
 * Load categories into the modal select and wire up form submission.
 */
async function initCreateNewsModal(currentUser) {
  const categorySelect = document.getElementById("newsCategory");
  const form           = document.getElementById("createNewsForm");
  const modalError     = document.getElementById("modalError");
  const modalSuccess   = document.getElementById("modalSuccess");
  const submitBtn      = document.getElementById("submitNewsBtn");

  // Populate categories dropdown
  const { data: categories } = await fetchCategories();
  if (categories) {
    categories.forEach((cat) => {
      const opt = document.createElement("option");
      opt.value = cat.id;
      opt.textContent = cat.name;
      categorySelect.appendChild(opt);
    });
  }

  // Handle form submission
  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    modalError.classList.add("d-none");
    modalSuccess.classList.add("d-none");

    const title       = document.getElementById("newsTitle").value.trim();
    const categoryId  = categorySelect.value;
    const content     = document.getElementById("newsContent").value.trim();
    const imageFile   = document.getElementById("newsImage").files[0];

    if (!title || !categoryId || !content || !imageFile) {
      modalError.textContent = "All fields are required.";
      modalError.classList.remove("d-none");
      return;
    }

    // Disable button while processing
    submitBtn.disabled = true;
    submitBtn.textContent = "Uploading…";

    // 1. Upload image
    const { url: imageUrl, error: uploadError } = await uploadArticleImage(imageFile);
    if (uploadError) {
      modalError.textContent = "Image upload failed: " + uploadError.message;
      modalError.classList.remove("d-none");
      submitBtn.disabled = false;
      submitBtn.textContent = "Submit for Approval";
      return;
    }

    // 2. Insert article (is_published = false enforced by service + RLS)
    const { error: insertError } = await createNews({
      title,
      content,
      image_url: imageUrl,
      category_id: categoryId,
      author_id: currentUser.id,
    });

    if (insertError) {
      modalError.textContent = "Failed to create article: " + insertError.message;
      modalError.classList.remove("d-none");
      submitBtn.disabled = false;
      submitBtn.textContent = "Submit for Approval";
      return;
    }

    // Success
    modalSuccess.textContent = "Article submitted! It will be reviewed by an editor.";
    modalSuccess.classList.remove("d-none");
    form.reset();
    submitBtn.disabled = false;
    submitBtn.textContent = "Submit for Approval";
  });
}

// ─── Load Favorites ───────────────────────────────────────────────────────────

const favoritesList = document.getElementById("favoritesList");
const noFavorites   = document.getElementById("noFavorites");

const { data: favorites, error } = await supabase
  .from("favorites")
  .select("news_id, news_articles(id, title, image_url, category_id, categories(name))")
  .eq("user_id", user.id);

if (error) {
  console.error("Favorites error:", error.message);
}

if (!favorites || favorites.length === 0) {
  noFavorites.classList.remove("d-none");
} else {
  favoritesList.innerHTML = favorites
    .map(
      (f) => `
      <div class="col-sm-6 col-lg-4">
        <div class="card h-100 shadow-sm">
          <img
            src="${f.news_articles?.image_url || "https://placehold.co/600x300?text=No+Image"}"
            class="card-img-top"
            style="height: 160px; object-fit: cover;"
            alt="${escapeHtml(f.news_articles?.title ?? "")}"
          />
          <div class="card-body d-flex flex-column">
            <span class="badge bg-secondary mb-1">${escapeHtml(f.news_articles?.categories?.name ?? "")}</span>
            <h6 class="card-title">${escapeHtml(f.news_articles?.title ?? "")}</h6>
            <a
              href="/pages/news-details.html?id=${f.news_articles?.id}"
              class="btn btn-dark btn-sm mt-auto"
            >Read</a>
          </div>
        </div>
      </div>
      `
    )
    .join("");
}

// ─── Helper ───────────────────────────────────────────────────────────────────

function escapeHtml(str) {
  const d = document.createElement("div");
  d.textContent = str;
  return d.innerHTML;
}
