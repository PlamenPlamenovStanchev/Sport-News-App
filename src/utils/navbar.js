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
      ? `<li class="nav-item"><a class="nav-link text-warning fw-semibold" href="/pages/admin.html"><i data-lucide="shield" class="icon-inline"></i> Admin Panel</a></li>`
      : "";

    // Logged-in links
    container.innerHTML = `
      <li class="nav-item">
        <a class="nav-link" href="/index.html"><i data-lucide="home" class="icon-inline"></i> Home</a>
      </li>
      <li class="nav-item">
        <a class="nav-link" href="/pages/about.html"><i data-lucide="info" class="icon-inline"></i> About</a>
      </li>
      <li class="nav-item">
        <a class="nav-link" href="/pages/contact.html"><i data-lucide="mail" class="icon-inline"></i> Contact Us</a>
      </li>
      ${adminLink}
      <li class="nav-item">
        <a class="nav-link fw-semibold" href="/profile/"><i data-lucide="user" class="icon-inline"></i> My Profile</a>
      </li>
      <li class="nav-item">
        <button id="navLogoutBtn" class="btn btn-outline-light btn-sm ms-lg-2">
          <i data-lucide="log-out" class="icon-inline"></i> Logout
        </button>
      </li>
    `;

    document.getElementById("navLogoutBtn").addEventListener("click", logout);
  } else {
    // Guest links
    container.innerHTML = `
      <li class="nav-item">
        <a class="nav-link" href="/index.html"><i data-lucide="home" class="icon-inline"></i> Home</a>
      </li>
      <li class="nav-item">
        <a class="nav-link" href="/pages/about.html"><i data-lucide="info" class="icon-inline"></i> About</a>
      </li>
      <li class="nav-item">
        <a class="nav-link" href="/pages/contact.html"><i data-lucide="mail" class="icon-inline"></i> Contact Us</a>
      </li>
      <li class="nav-item">
        <a class="nav-link" href="/login/"><i data-lucide="log-in" class="icon-inline"></i> Login</a>
      </li>
      <li class="nav-item">
        <a class="btn btn-outline-light btn-sm ms-lg-2" href="/login/?tab=register"><i data-lucide="user-plus" class="icon-inline"></i> Register</a>
      </li>
    `;
  }

  // Render Lucide icons inside dynamically injected navbar HTML
  if (window.lucide) window.lucide.createIcons();
}
