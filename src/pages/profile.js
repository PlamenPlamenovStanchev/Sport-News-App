// src/pages/profile.js
// ---------------------
// Displays the logged-in user's profile information and favorite articles.

import { requireAuth, getCurrentProfile, logout } from "../utils/auth.js";
import { supabase } from "../services/supabaseClient.js";

// Guard: must be logged in
const user = await requireAuth();
const { profile } = await getCurrentProfile();

// ─── Render Profile Info ──────────────────────────────────────────────────────

const profileContent = document.getElementById("profileContent");

profileContent.innerHTML = `
  <div class="card p-4 shadow-sm" style="max-width: 480px;">
    <p><strong>Username:</strong> ${profile?.username ?? "—"}</p>
    <p><strong>Email:</strong> ${user.email}</p>
    <p><strong>Role:</strong> <span class="badge bg-dark">${profile?.role ?? "user"}</span></p>
    <p><strong>Member since:</strong> ${new Date(user.created_at).toLocaleDateString("en-GB")}</p>
    <button id="logoutBtn" class="btn btn-outline-danger btn-sm mt-2">Logout</button>
  </div>
`;

document.getElementById("logoutBtn").addEventListener("click", logout);

// ─── Load Favorites ───────────────────────────────────────────────────────────

const favoritesList = document.getElementById("favoritesList");

const { data: favorites, error } = await supabase
  .from("favorites")
  .select("news_id, news(id, title, image_url, sport_tag)")
  .eq("user_id", user.id);

if (error || !favorites || favorites.length === 0) {
  favoritesList.innerHTML = `<p class="text-muted">No favorites yet.</p>`;
} else {
  favoritesList.innerHTML = favorites
    .map(
      (f) => `
      <div class="col-sm-6 col-lg-4">
        <div class="card h-100 shadow-sm">
          <img
            src="${f.news?.image_url || "https://placehold.co/600x300?text=No+Image"}"
            class="card-img-top"
            style="height: 160px; object-fit: cover;"
            alt="${f.news?.title ?? ""}"
          />
          <div class="card-body">
            <span class="badge bg-secondary mb-1">${f.news?.sport_tag ?? ""}</span>
            <h6 class="card-title">${f.news?.title ?? ""}</h6>
            <a href="/pages/news-details.html?id=${f.news?.id}" class="btn btn-dark btn-sm mt-2">Read</a>
          </div>
        </div>
      </div>
    `
    )
    .join("");
}
