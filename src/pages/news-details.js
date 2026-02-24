// src/pages/news-details.js
// --------------------------
// Fetches and renders a single news article and its comments.
// Reads the article ID from the URL query string: ?id=<uuid>

import { fetchNewsById } from "../services/newsService.js";
import { supabase } from "../services/supabaseClient.js";
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
}

// ─── Comments ─────────────────────────────────────────────────────────────────

async function loadComments() {
  const { data: comments, error } = await supabase
    .from("comments")
    .select("id, content, created_at, user_id, profiles(username)")
    .eq("news_id", newsId)
    .order("created_at", { ascending: false });

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

    const { error } = await supabase.from("comments").insert([
      { news_id: newsId, user_id: user.id, content },
    ]);

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
