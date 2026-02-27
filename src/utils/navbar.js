// src/utils/navbar.js
// --------------------
// Renders auth-aware links into the element with id="navAuthLinks".
// Call initNavbar() from every page module that has a navbar.

import { getCurrentUser, getCurrentProfile, logout } from "./auth.js";

/**
 * Reads the current auth state and injects the correct links into #navAuthLinks.
 * Also attaches the logout click handler when applicable.
 */
export async function initNavbar() {
  const container = document.getElementById("navAuthLinks");
  if (!container) return;

  const user = await getCurrentUser();

  if (user) {
    // Fetch role for role-specific nav items
    const { profile } = await getCurrentProfile();
    const role = profile?.role ?? "user";

    // Admin Panel link (visible only to admins)
    const adminLink = role === "admin"
      ? `<li class="nav-item"><a class="nav-link text-warning fw-semibold" href="/pages/admin.html">Admin Panel</a></li>`
      : "";

    // Logged-in links
    container.innerHTML = `
      <li class="nav-item">
        <a class="nav-link" href="/index.html">Home</a>
      </li>
      <li class="nav-item">
        <a class="nav-link" href="/pages/about.html">About</a>
      </li>
      ${adminLink}
      <li class="nav-item">
        <a class="nav-link fw-semibold" href="/profile/">My Profile</a>
      </li>
      <li class="nav-item">
        <button id="navLogoutBtn" class="btn btn-outline-light btn-sm ms-lg-2">
          Logout
        </button>
      </li>
    `;

    document.getElementById("navLogoutBtn").addEventListener("click", logout);
  } else {
    // Guest links
    container.innerHTML = `
      <li class="nav-item">
        <a class="nav-link" href="/index.html">Home</a>
      </li>
      <li class="nav-item">
        <a class="nav-link" href="/pages/about.html">About</a>
      </li>
      <li class="nav-item">
        <a class="nav-link" href="/login/">Login</a>
      </li>
      <li class="nav-item">
        <a class="btn btn-outline-light btn-sm ms-lg-2" href="/login/?tab=register">Register</a>
      </li>
    `;
  }
}
