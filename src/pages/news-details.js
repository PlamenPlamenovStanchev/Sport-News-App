// src/pages/news-details.js
// --------------------------
// Fetches and renders a single news article and its comments.
// Reads the article ID from the URL query string: ?id=<uuid>

import { fetchNewsById, fetchCommentsByArticle, postComment, toggleArticleLike, countArticleLikes, hasUserLiked, toggleArticleFavourite, hasUserFavourited, recordArticleView } from "../services/newsService.js";
import { getCurrentUser } from "../utils/auth.js";

// ─── Read ID from URL ─────────────────────────────────────────────────────────

const params = new URLSearchParams(window.location.search);
const newsId = params.get("id");

if (!newsId) {
  document.getElementById("newsContent").innerHTML =
    `<p class="text-danger">No article ID provided.</p>`;
} else {
  init();
}

// ─── Init ─────────────────────────────────────────────────────────────────────

async function init() {
  const [user] = await Promise.all([getCurrentUser(), loadArticle(), loadComments()]);
  // Record view for logged-in users (fire-and-forget)
  if (user) {
    recordArticleView(user.id, newsId);
  }
  await Promise.all([initLikeButton(user), initFavouriteButton(user)]);
  handleCommentForm(user);
}

// ─── Article ──────────────────────────────────────────────────────────────────

async function loadArticle() {
  const { data: article, error } = await fetchNewsById(newsId);

  const container = document.getElementById("newsContent");

  if (error || !article) {
    container.innerHTML = `<p class="text-danger">Article not found.</p>`;
    return;
  }

  document.title = `${article.title} | Sport News App`;

  container.innerHTML = `
    <span class="badge bg-secondary mb-2">${article.sport_tag}</span>
    <h1 class="mb-3">${escapeHtml(article.title)}</h1>
    <p class="text-muted small">Published on ${formatDate(article.created_at)}</p>
    ${
      article.image_url
        ? `<img src="${article.image_url}" class="img-fluid rounded mb-4" alt="${escapeHtml(article.title)}" />`
        : ""
    }
    <div class="article-body">${escapeHtml(article.content)}</div>
  `;

  // Render author section
  const authorName = article.profiles?.username;
  if (authorName) {
    const section = document.getElementById("authorSection");
    document.getElementById("authorAvatar").textContent = authorName.charAt(0).toUpperCase();
    document.getElementById("authorName").textContent = authorName;
    section.classList.remove("d-none");
  }
}

// ─── Comments ─────────────────────────────────────────────────────────────────

async function loadComments() {
  const { data: comments, error } = await fetchCommentsByArticle(newsId);

  const list = document.getElementById("commentsList");

  if (error) {
    list.innerHTML = `<p class="text-danger small">Could not load comments.</p>`;
    return;
  }

  if (!comments || comments.length === 0) {
    list.innerHTML = `<p class="text-muted small">No comments yet. Be the first!</p>`;
    return;
  }

  list.innerHTML = comments
    .map(
      (c) => `
      <div class="border rounded p-3 mb-2">
        <p class="mb-1">${escapeHtml(c.content)}</p>
        <small class="text-muted">
          by <strong>${c.profiles?.username ?? "Unknown"}</strong> &middot;
          ${formatDate(c.created_at)}
        </small>
      </div>
    `
    )
    .join("");
}

// ─── Like Button ──────────────────────────────────────────────────────────────

async function initLikeButton(user) {
  const btn = document.getElementById("likeBtn");
  const countEl = document.getElementById("likeCount");

  // Load total likes for this article
  const { count } = await countArticleLikes(newsId);
  countEl.textContent = count;

  if (!user) return; // not logged in — button stays hidden

  // Check if current user already liked
  const { liked } = await hasUserLiked(user.id, newsId);
  updateLikeBtn(btn, liked);
  btn.classList.remove("d-none");

  btn.addEventListener("click", async () => {
    btn.disabled = true;
    const { liked: nowLiked, error } = await toggleArticleLike(user.id, newsId);
    if (error) {
      console.error("Like error:", error.message);
      btn.disabled = false;
      return;
    }
    updateLikeBtn(btn, nowLiked);
    const { count: newCount } = await countArticleLikes(newsId);
    countEl.textContent = newCount;
    btn.disabled = false;
  });
}

function updateLikeBtn(btn, liked) {
  if (liked) {
    btn.innerHTML = "&#9829; Liked";
    btn.classList.remove("btn-outline-danger");
    btn.classList.add("btn-danger");
  } else {
    btn.innerHTML = "&#9825; Like";
    btn.classList.remove("btn-danger");
    btn.classList.add("btn-outline-danger");
  }
}

// ─── Favourite Button ──────────────────────────────────────────────────────────

async function initFavouriteButton(user) {
  const btn = document.getElementById("favBtn");

  if (!user) return; // not logged in — button stays hidden

  const { favourited } = await hasUserFavourited(user.id, newsId);
  updateFavBtn(btn, favourited);
  btn.classList.remove("d-none");

  btn.addEventListener("click", async () => {
    btn.disabled = true;
    const { favourited: nowFav, error } = await toggleArticleFavourite(user.id, newsId);
    if (error) {
      console.error("Favourite error:", error.message);
      btn.disabled = false;
      return;
    }
    updateFavBtn(btn, nowFav);
    btn.disabled = false;
  });
}

function updateFavBtn(btn, favourited) {
  if (favourited) {
    btn.innerHTML = "&#9733; Favourited";
    btn.classList.remove("btn-outline-warning");
    btn.classList.add("btn-warning");
  } else {
    btn.innerHTML = "&#9734; Favourite";
    btn.classList.remove("btn-warning");
    btn.classList.add("btn-outline-warning");
  }
}

// ─── Comment Form ─────────────────────────────────────────────────────────────

function handleCommentForm(user) {
  const form = document.getElementById("commentForm");
  const loginPrompt = document.getElementById("loginPrompt");

  if (!user) {
    // Not logged in — show login prompt, hide form
    form.classList.add("d-none");
    loginPrompt.classList.remove("d-none");
    return;
  }

  // Logged in — show form, hide prompt
  form.classList.remove("d-none");
  loginPrompt.classList.add("d-none");

  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const content = document.getElementById("commentInput").value.trim();
    if (!content) return;

    const { error } = await postComment({
      article_id: newsId,
      user_id: user.id,
      content,
    });

    if (error) {
      alert("Failed to post comment: " + error.message);
      return;
    }

    document.getElementById("commentInput").value = "";
    await loadComments();
  });
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function escapeHtml(str) {
  const d = document.createElement("div");
  d.textContent = str;
  return d.innerHTML;
}

function formatDate(iso) {
  return new Date(iso).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}
