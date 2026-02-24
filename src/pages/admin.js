// src/pages/admin.js
// -------------------
// Admin panel: manage users, approve/reject pending news, view all news.
// Only accessible to admins.

import { requireRole } from "../utils/auth.js";
import { supabase } from "../services/supabaseClient.js";
import { setNewsStatus, deleteNews } from "../services/newsService.js";

// Guard: only admin role
await requireRole(["admin"]);

const tabContent = document.getElementById("tabContent");
const tabButtons = document.querySelectorAll("#adminTabs button[data-tab]");

// Active tab tracking
let activeTab = "users";
loadTab(activeTab);

// ─── Tab Navigation ───────────────────────────────────────────────────────────

tabButtons.forEach((btn) => {
  btn.addEventListener("click", () => {
    tabButtons.forEach((b) => b.classList.remove("active"));
    btn.classList.add("active");
    activeTab = btn.dataset.tab;
    loadTab(activeTab);
  });
});

function loadTab(tab) {
  tabContent.innerHTML = `<p class="text-muted">Loading...</p>`;

  if (tab === "users") loadUsers();
  else if (tab === "pending") loadPendingNews();
  else if (tab === "allNews") loadAllNews();
}

// ─── Users Tab ────────────────────────────────────────────────────────────────

async function loadUsers() {
  const { data: profiles, error } = await supabase
    .from("profiles")
    .select("id, username, role, created_at")
    .order("created_at", { ascending: false });

  if (error) {
    tabContent.innerHTML = `<p class="text-danger">Failed to load users.</p>`;
    return;
  }

  tabContent.innerHTML = `
    <table class="table table-bordered table-hover">
      <thead class="table-dark">
        <tr><th>Username</th><th>Role</th><th>Joined</th><th>Change Role</th></tr>
      </thead>
      <tbody>
        ${profiles
          .map(
            (p) => `
          <tr>
            <td>${p.username ?? "—"}</td>
            <td><span class="badge bg-secondary">${p.role}</span></td>
            <td>${new Date(p.created_at).toLocaleDateString("en-GB")}</td>
            <td>
              <select class="form-select form-select-sm" data-user-id="${p.id}">
                <option value="user"    ${p.role === "user"    ? "selected" : ""}>user</option>
                <option value="author"  ${p.role === "author"  ? "selected" : ""}>author</option>
                <option value="editor"  ${p.role === "editor"  ? "selected" : ""}>editor</option>
                <option value="admin"   ${p.role === "admin"   ? "selected" : ""}>admin</option>
              </select>
            </td>
          </tr>
        `
          )
          .join("")}
      </tbody>
    </table>
  `;

  // Listen for role changes
  tabContent.querySelectorAll("select[data-user-id]").forEach((select) => {
    select.addEventListener("change", async () => {
      const { error } = await supabase
        .from("profiles")
        .update({ role: select.value })
        .eq("id", select.dataset.userId);

      if (error) alert("Failed to update role: " + error.message);
    });
  });
}

// ─── Pending News Tab ─────────────────────────────────────────────────────────

async function loadPendingNews() {
  const { data: articles, error } = await supabase
    .from("news")
    .select("id, title, sport_tag, created_at, profiles(username)")
    .eq("status", "pending")
    .order("created_at", { ascending: false });

  if (error) {
    tabContent.innerHTML = `<p class="text-danger">Failed to load pending news.</p>`;
    return;
  }

  if (!articles.length) {
    tabContent.innerHTML = `<p class="text-muted">No pending articles.</p>`;
    return;
  }

  tabContent.innerHTML = `
    <table class="table table-bordered table-hover">
      <thead class="table-dark">
        <tr><th>Title</th><th>Sport</th><th>Author</th><th>Date</th><th>Actions</th></tr>
      </thead>
      <tbody>
        ${articles
          .map(
            (a) => `
          <tr data-id="${a.id}">
            <td>${a.title}</td>
            <td>${a.sport_tag}</td>
            <td>${a.profiles?.username ?? "—"}</td>
            <td>${new Date(a.created_at).toLocaleDateString("en-GB")}</td>
            <td class="d-flex gap-2">
              <button class="btn btn-success btn-sm" data-action="approve">Approve</button>
              <button class="btn btn-danger btn-sm"  data-action="reject">Reject</button>
            </td>
          </tr>
        `
          )
          .join("")}
      </tbody>
    </table>
  `;

  tabContent.querySelectorAll("tr[data-id]").forEach((row) => {
    const id = row.dataset.id;

    row.querySelector("[data-action='approve']").addEventListener("click", async () => {
      const { error } = await setNewsStatus(id, "approved");
      if (!error) row.remove();
    });

    row.querySelector("[data-action='reject']").addEventListener("click", async () => {
      const { error } = await setNewsStatus(id, "rejected");
      if (!error) row.remove();
    });
  });
}

// ─── All News Tab ─────────────────────────────────────────────────────────────

async function loadAllNews() {
  const { data: articles, error } = await supabase
    .from("news")
    .select("id, title, sport_tag, status, created_at")
    .order("created_at", { ascending: false });

  if (error) {
    tabContent.innerHTML = `<p class="text-danger">Failed to load news.</p>`;
    return;
  }

  tabContent.innerHTML = `
    <table class="table table-bordered table-hover">
      <thead class="table-dark">
        <tr><th>Title</th><th>Sport</th><th>Status</th><th>Date</th><th>Actions</th></tr>
      </thead>
      <tbody>
        ${articles
          .map(
            (a) => `
          <tr data-id="${a.id}">
            <td>${a.title}</td>
            <td>${a.sport_tag}</td>
            <td><span class="badge bg-${statusColor(a.status)}">${a.status}</span></td>
            <td>${new Date(a.created_at).toLocaleDateString("en-GB")}</td>
            <td class="d-flex gap-2">
              <a href="/pages/edit-news.html?id=${a.id}" class="btn btn-outline-dark btn-sm">Edit</a>
              <button class="btn btn-danger btn-sm" data-action="delete">Delete</button>
            </td>
          </tr>
        `
          )
          .join("")}
      </tbody>
    </table>
  `;

  tabContent.querySelectorAll("[data-action='delete']").forEach((btn) => {
    btn.addEventListener("click", async () => {
      const row = btn.closest("tr[data-id]");
      if (!confirm("Delete this article?")) return;
      const { error } = await deleteNews(row.dataset.id);
      if (!error) row.remove();
    });
  });
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function statusColor(status) {
  if (status === "approved") return "success";
  if (status === "rejected") return "danger";
  return "warning";
}
