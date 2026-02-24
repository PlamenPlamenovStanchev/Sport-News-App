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

// ─── Load Favorites ───────────────────────────────────────────────────────────

const favoritesList = document.getElementById("favoritesList");
const noFavorites   = document.getElementById("noFavorites");

const { data: favorites, error } = await supabase
  .from("favorites")
  .select("news_id, news(id, title, image_url, sport_tag)")
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
            src="${f.news?.image_url || "https://placehold.co/600x300?text=No+Image"}"
            class="card-img-top"
            style="height: 160px; object-fit: cover;"
            alt="${escapeHtml(f.news?.title ?? "")}"
          />
          <div class="card-body d-flex flex-column">
            <span class="badge bg-secondary mb-1">${f.news?.sport_tag ?? ""}</span>
            <h6 class="card-title">${escapeHtml(f.news?.title ?? "")}</h6>
            <a
              href="/pages/news-details.html?id=${f.news?.id}"
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
