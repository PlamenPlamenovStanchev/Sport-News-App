// src/pages/admin.js
// -------------------
// Admin panel: News Management + User Management.
// Only accessible to users with role = "admin".

import { requireRole, getCurrentUser } from "../utils/auth.js";
import {
  fetchAllArticles,
  fetchCategories,
  createNewsAsAdmin,
  updateNews,
  deleteNews,
  approveArticle,
  rejectArticle,
  uploadArticleImage,
} from "../services/newsService.js";
import {
  fetchAllUsers,
  updateUserRole,
  deleteUserData,
  createUser,
  fetchContactMessages,
  deleteContactMessage,
} from "../services/adminService.js";

// ─── Auth Guard ───────────────────────────────────────────────────────────────
await requireRole(["admin"]);
const currentUser = await getCurrentUser();

// Reveal content
document.getElementById("adminLoading").classList.add("d-none");
document.getElementById("adminContent").classList.remove("d-none");

// ─── State ────────────────────────────────────────────────────────────────────
let categoriesCache = [];
let activeTab = "news";

// ─── Pre-load categories ──────────────────────────────────────────────────────
const { data: cats } = await fetchCategories();
categoriesCache = cats || [];

// ─── Tab Navigation ───────────────────────────────────────────────────────────
const tabContent = document.getElementById("tabContent");
const tabButtons = document.querySelectorAll("#adminTabs button[data-tab]");

tabButtons.forEach((btn) => {
  btn.addEventListener("click", () => {
    tabButtons.forEach((b) => b.classList.remove("active"));
    btn.classList.add("active");
    activeTab = btn.dataset.tab;
    loadTab(activeTab);
  });
});

loadTab(activeTab);

function loadTab(tab) {
  tabContent.innerHTML = `<p class="text-muted">Loading…</p>`;
  if (tab === "news") loadNewsTab();
  else if (tab === "users") loadUsersTab();
  else if (tab === "messages") loadMessagesTab();
}

// ═════════════════════════════════════════════════════════════════════════════
// TAB 1: NEWS MANAGEMENT
// ═════════════════════════════════════════════════════════════════════════════

async function loadNewsTab() {
  const { data: articles, error } = await fetchAllArticles();

  if (error) {
    tabContent.innerHTML = `<p class="text-danger">Failed to load articles: ${esc(error.message)}</p>`;
    return;
  }

  tabContent.innerHTML = `
    <div class="d-flex justify-content-between align-items-center mb-3">
      <h5 class="mb-0">All Articles (${articles?.length ?? 0})</h5>
      <button class="btn btn-success btn-sm" id="addArticleBtn">+ Add Article</button>
    </div>
    ${!articles?.length
      ? '<p class="text-muted">No articles yet.</p>'
      : `
    <div class="table-responsive">
      <table class="table table-hover align-middle">
        <thead class="table-dark">
          <tr>
            <th>Image</th>
            <th>Title</th>
            <th>Category</th>
            <th>Status</th>
            <th>Created</th>
            <th class="text-end">Actions</th>
          </tr>
        </thead>
        <tbody>
          ${articles.map((a) => {
            const status = a.is_published;
            const badge = status
              ? '<span class="badge bg-success">Approved</span>'
              : '<span class="badge bg-warning text-dark">Pending</span>';
            const date = fmtDate(a.created_at);
            return `
              <tr id="article-row-${a.id}">
                <td style="width:70px;">
                  <img src="${a.image_url || 'https://placehold.co/70x45?text=—'}"
                       class="rounded" style="width:70px;height:45px;object-fit:cover;" />
                </td>
                <td class="fw-semibold">${esc(a.title)}</td>
                <td>${esc(a.categories?.name ?? "—")}</td>
                <td>${badge}</td>
                <td class="text-muted small">${date}</td>
                <td class="text-end">
                  <div class="btn-group btn-group-sm">
                    ${!status ? `<button class="btn btn-success btn-approve-article" data-id="${a.id}">Approve</button>` : ""}
                    <button class="btn btn-primary btn-edit-article" data-id="${a.id}"
                      data-title="${esc(a.title)}"
                      data-content="${esc(a.content)}"
                      data-category="${a.category_id ?? ""}"
                      data-status="${a.is_published}"
                    >Edit</button>
                    <button class="btn btn-danger btn-delete-article" data-id="${a.id}">Delete</button>
                  </div>
                </td>
              </tr>`;
          }).join("")}
        </tbody>
      </table>
    </div>`
    }
  `;

  // ─── Add Article button ────────────────────────────────
  document.getElementById("addArticleBtn")?.addEventListener("click", () => {
    openArticleModal(null);
  });

  // ─── Approve buttons ──────────────────────────────────
  tabContent.querySelectorAll(".btn-approve-article").forEach((btn) => {
    btn.addEventListener("click", async () => {
      btn.disabled = true;
      btn.textContent = "…";
      const { error } = await approveArticle(btn.dataset.id);
      if (error) { alert("Approve failed: " + error.message); btn.disabled = false; btn.textContent = "Approve"; return; }
      loadNewsTab();
    });
  });

  // ─── Edit buttons (with confirmation) ───────────────────
  tabContent.querySelectorAll(".btn-edit-article").forEach((btn) => {
    btn.addEventListener("click", async () => {
      const ok = await showConfirm({
        title: "Edit Article",
        body: `Open editor for "${btn.dataset.title}"?`,
        okLabel: "Edit",
        okClass: "btn-primary",
      });
      if (!ok) return;
      openArticleModal({
        id: btn.dataset.id,
        title: btn.dataset.title,
        content: btn.dataset.content,
        category_id: btn.dataset.category,
        is_published: btn.dataset.status === "true",
      });
    });
  });

  // ─── Delete buttons (with confirmation) ─────────────────
  tabContent.querySelectorAll(".btn-delete-article").forEach((btn) => {
    btn.addEventListener("click", async () => {
      const ok = await showConfirm({
        title: "Delete Article",
        body: "Permanently delete this article? This cannot be undone.",
        okLabel: "Delete",
        okClass: "btn-danger",
      });
      if (!ok) return;
      btn.disabled = true;
      const { error } = await deleteNews(btn.dataset.id);
      if (error) { alert("Delete failed: " + error.message); btn.disabled = false; return; }
      document.getElementById(`article-row-${btn.dataset.id}`)?.remove();
    });
  });
}

// ─── Article Modal ────────────────────────────────────────────────────────────

function openArticleModal(article) {
  const modal       = new bootstrap.Modal(document.getElementById("articleModal"));
  const label       = document.getElementById("articleModalLabel");
  const errEl       = document.getElementById("articleModalError");
  const successEl   = document.getElementById("articleModalSuccess");
  const form        = document.getElementById("articleForm");
  const idField     = document.getElementById("articleFormId");
  const titleField  = document.getElementById("articleFormTitle");
  const catField    = document.getElementById("articleFormCategory");
  const imageField  = document.getElementById("articleFormImage");
  const imageHint   = document.getElementById("articleFormImageHint");
  const contentField = document.getElementById("articleFormContent");
  const statusField = document.getElementById("articleFormStatus");
  const submitBtn   = document.getElementById("articleFormSubmit");

  errEl.classList.add("d-none");
  successEl.classList.add("d-none");

  // Populate categories
  catField.innerHTML = '<option value="">Select a category…</option>';
  categoriesCache.forEach((c) => {
    const opt = document.createElement("option");
    opt.value = c.id;
    opt.textContent = c.name;
    catField.appendChild(opt);
  });

  const isEdit = !!article?.id;
  label.textContent = isEdit ? "Edit Article" : "Add Article";
  submitBtn.textContent = isEdit ? "Save Changes" : "Create Article";

  idField.value       = article?.id ?? "";
  titleField.value    = article?.title ?? "";
  catField.value      = article?.category_id ?? "";
  contentField.value  = article?.content ?? "";
  statusField.value   = article?.is_published ? "true" : "false";
  imageField.value    = "";
  imageHint.textContent = isEdit ? "Leave empty to keep current image." : "Required for new articles.";
  imageField.required = !isEdit;

  // Remove old listener by cloning
  const newForm = form.cloneNode(true);
  form.parentNode.replaceChild(newForm, form);

  newForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const artModal = document.getElementById("articleModal");
    const err2  = artModal.querySelector("#articleModalError");
    const suc2  = artModal.querySelector("#articleModalSuccess");
    const sub2  = newForm.querySelector("#articleFormSubmit");
    err2.classList.add("d-none");
    suc2.classList.add("d-none");
    sub2.disabled = true;
    sub2.textContent = "Saving…";

    const title   = newForm.querySelector("#articleFormTitle").value.trim();
    const catId   = newForm.querySelector("#articleFormCategory").value;
    const content = newForm.querySelector("#articleFormContent").value.trim();
    const status  = newForm.querySelector("#articleFormStatus").value === "true";
    const file    = newForm.querySelector("#articleFormImage").files[0];

    if (!title || !catId || !content) {
      err2.textContent = "Title, category, and content are required.";
      err2.classList.remove("d-none");
      sub2.disabled = false;
      sub2.textContent = isEdit ? "Save Changes" : "Create Article";
      return;
    }

    let imageUrl = null;
    if (file) {
      const { url, error: upErr } = await uploadArticleImage(file);
      if (upErr) {
        err2.textContent = "Image upload failed: " + upErr.message;
        err2.classList.remove("d-none");
        sub2.disabled = false;
        sub2.textContent = isEdit ? "Save Changes" : "Create Article";
        return;
      }
      imageUrl = url;
    }

    let opError;

    if (isEdit) {
      const fields = { title, content, category_id: catId, is_published: status };
      if (imageUrl) fields.image_url = imageUrl;
      const { error } = await updateNews(article.id, fields);
      opError = error;
    } else {
      if (!imageUrl) {
        err2.textContent = "Image is required for new articles.";
        err2.classList.remove("d-none");
        sub2.disabled = false;
        sub2.textContent = "Create Article";
        return;
      }
      const payload = {
        title,
        content,
        category_id: catId,
        author_id: currentUser.id,
        image_url: imageUrl,
      };
      // Admin creates as published directly
      const { error } = await createNewsAsAdmin(payload);
      opError = error;
    }

    if (opError) {
      err2.textContent = opError.message;
      err2.classList.remove("d-none");
      sub2.disabled = false;
      sub2.textContent = isEdit ? "Save Changes" : "Create Article";
      return;
    }

    suc2.textContent = isEdit ? "Article updated!" : "Article created!";
    suc2.classList.remove("d-none");
    sub2.disabled = false;
    sub2.textContent = isEdit ? "Save Changes" : "Create Article";

    // Refresh table after short delay
    setTimeout(() => { modal.hide(); loadNewsTab(); }, 800);
  });

  modal.show();
}

// ═════════════════════════════════════════════════════════════════════════════
// TAB 2: USER MANAGEMENT
// ═════════════════════════════════════════════════════════════════════════════

async function loadUsersTab() {
  const { data: users, error } = await fetchAllUsers();

  if (error) {
    tabContent.innerHTML = `<p class="text-danger">Failed to load users: ${esc(error.message)}</p>`;
    return;
  }

  tabContent.innerHTML = `
    <div class="d-flex justify-content-between align-items-center mb-3">
      <h5 class="mb-0">All Users (${users?.length ?? 0})</h5>
      <button class="btn btn-success btn-sm" id="addUserBtn">+ Add User</button>
    </div>
    ${!users?.length
      ? '<p class="text-muted">No users found.</p>'
      : `
    <div class="table-responsive">
      <table class="table table-hover align-middle">
        <thead class="table-dark">
          <tr>
            <th>Username</th>
            <th>Role</th>
            <th>Joined</th>
            <th class="text-end">Actions</th>
          </tr>
        </thead>
        <tbody>
          ${users.map((u) => `
            <tr id="user-row-${u.id}">
              <td class="fw-semibold">${esc(u.username ?? "—")}</td>
              <td><span class="badge bg-${roleBadge(u.role)}">${u.role}</span></td>
              <td class="text-muted small">${fmtDate(u.created_at)}</td>
              <td class="text-end">
                <div class="btn-group btn-group-sm">
                  <button class="btn btn-primary btn-edit-user"
                    data-id="${u.id}"
                    data-username="${esc(u.username ?? "")}"
                    data-role="${u.role}"
                  >Edit Role</button>
                  <button class="btn btn-danger btn-delete-user" data-id="${u.id}" data-username="${esc(u.username ?? "")}">Delete</button>
                </div>
              </td>
            </tr>
          `).join("")}
        </tbody>
      </table>
    </div>`
    }
  `;

  // ─── Add User ─────────────────────────────────────────
  document.getElementById("addUserBtn")?.addEventListener("click", () => {
    openUserModal(null);
  });

  // ─── Edit Role (with confirmation) ──────────────────────────
  tabContent.querySelectorAll(".btn-edit-user").forEach((btn) => {
    btn.addEventListener("click", async () => {
      const ok = await showConfirm({
        title: "Edit User Role",
        body: `Change role for "${btn.dataset.username || 'this user'}"?`,
        okLabel: "Edit Role",
        okClass: "btn-primary",
      });
      if (!ok) return;
      openUserModal({
        id: btn.dataset.id,
        username: btn.dataset.username,
        role: btn.dataset.role,
      });
    });
  });

  // ─── Delete User (with confirmation) ────────────────────────
  tabContent.querySelectorAll(".btn-delete-user").forEach((btn) => {
    btn.addEventListener("click", async () => {
      const name = btn.dataset.username || btn.dataset.id;
      const ok = await showConfirm({
        title: "Delete User",
        body: `Permanently delete "${name}" and all their data? This cannot be undone.`,
        okLabel: "Delete",
        okClass: "btn-danger",
      });
      if (!ok) return;
      btn.disabled = true;
      const { error } = await deleteUserData(btn.dataset.id);
      if (error) { alert("Delete failed: " + error.message); btn.disabled = false; return; }
      document.getElementById(`user-row-${btn.dataset.id}`)?.remove();
    });
  });
}

// ─── User Modal ───────────────────────────────────────────────────────────────

function openUserModal(userData) {
  const modal      = new bootstrap.Modal(document.getElementById("userModal"));
  const label      = document.getElementById("userModalLabel");
  const errEl      = document.getElementById("userModalError");
  const successEl  = document.getElementById("userModalSuccess");
  const form       = document.getElementById("userForm");
  const idField    = document.getElementById("userFormId");
  const newFields  = document.getElementById("userFormNewFields");
  const emailField = document.getElementById("userFormEmail");
  const passField  = document.getElementById("userFormPassword");
  const nameField  = document.getElementById("userFormUsername");
  const roleField  = document.getElementById("userFormRole");
  const submitBtn  = document.getElementById("userFormSubmit");

  errEl.classList.add("d-none");
  successEl.classList.add("d-none");

  const isEdit = !!userData?.id;
  label.textContent    = isEdit ? `Edit Role: ${userData.username || "User"}` : "Add New User";
  submitBtn.textContent = isEdit ? "Update Role" : "Create User";

  idField.value   = userData?.id ?? "";
  roleField.value = userData?.role ?? "user";

  // Show/hide new-user fields
  if (isEdit) {
    newFields.classList.add("d-none");
    emailField.removeAttribute("required");
    passField.removeAttribute("required");
  } else {
    newFields.classList.remove("d-none");
    emailField.setAttribute("required", "");
    passField.setAttribute("required", "");
    emailField.value = "";
    passField.value  = "";
    nameField.value  = "";
  }

  // Clone to remove old listeners
  const newForm = form.cloneNode(true);
  form.parentNode.replaceChild(newForm, form);

  newForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const modalBody = document.getElementById("userModal");
    const err2 = modalBody.querySelector("#userModalError");
    const suc2 = modalBody.querySelector("#userModalSuccess");
    const sub2 = newForm.querySelector("#userFormSubmit");
    err2.classList.add("d-none");
    suc2.classList.add("d-none");
    sub2.disabled = true;
    sub2.textContent = "Saving…";

    const role = newForm.querySelector("#userFormRole").value;

    if (isEdit) {
      // Update role only
      const { error } = await updateUserRole(userData.id, role);
      if (error) {
        err2.textContent = "Failed: " + error.message;
        err2.classList.remove("d-none");
        sub2.disabled = false;
        sub2.textContent = "Update Role";
        return;
      }
      suc2.textContent = "Role updated!";
      suc2.classList.remove("d-none");
    } else {
      // Create new user
      const email    = newForm.querySelector("#userFormEmail").value.trim();
      const password = newForm.querySelector("#userFormPassword").value;
      const username = newForm.querySelector("#userFormUsername").value.trim() || email.split("@")[0];

      if (!email || !password) {
        err2.textContent = "Email and password are required.";
        err2.classList.remove("d-none");
        sub2.disabled = false;
        sub2.textContent = "Create User";
        return;
      }

      const { error } = await createUser({ email, password, username, role });
      if (error) {
        err2.textContent = "Failed: " + error.message;
        err2.classList.remove("d-none");
        sub2.disabled = false;
        sub2.textContent = "Create User";
        return;
      }
      suc2.textContent = "User created!";
      suc2.classList.remove("d-none");
    }

    sub2.disabled = false;
    sub2.textContent = isEdit ? "Update Role" : "Create User";
    setTimeout(() => { modal.hide(); loadUsersTab(); }, 800);
  });

  modal.show();
}

// ═════════════════════════════════════════════════════════════════════════════
// HELPERS
// ═════════════════════════════════════════════════════════════════════════════

function esc(str) {
  const d = document.createElement("div");
  d.textContent = str ?? "";
  return d.innerHTML;
}

function fmtDate(iso) {
  return new Date(iso).toLocaleDateString("en-GB", {
    day: "numeric", month: "short", year: "numeric",
  });
}

function roleBadge(role) {
  if (role === "admin")  return "danger";
  if (role === "editor") return "info";
  if (role === "author") return "primary";
  return "secondary";
}

/**
 * Show a Bootstrap confirmation modal and return a Promise that resolves
 * to true (confirmed) or false (cancelled).
 *
 * @param {{ title?: string, body?: string, okLabel?: string, okClass?: string }} opts
 * @returns {Promise<boolean>}
 */
function showConfirm({ title = "Confirm", body = "Are you sure?", okLabel = "Confirm", okClass = "btn-danger" } = {}) {
  return new Promise((resolve) => {
    const modalEl = document.getElementById("confirmModal");
    document.getElementById("confirmModalTitle").textContent = title;
    document.getElementById("confirmModalBody").textContent = body;
    const okBtn = document.getElementById("confirmModalOk");
    okBtn.textContent = okLabel;
    okBtn.className = `btn btn-sm ${okClass}`;

    const modal = bootstrap.Modal.getOrCreateInstance(modalEl);

    // Cleanup helper
    function cleanup(result) {
      okBtn.removeEventListener("click", onOk);
      modalEl.removeEventListener("hidden.bs.modal", onHidden);
      resolve(result);
    }
    function onOk() { modal.hide(); cleanup(true); }
    function onHidden() { cleanup(false); }

    okBtn.addEventListener("click", onOk, { once: true });
    modalEl.addEventListener("hidden.bs.modal", onHidden, { once: true });

    modal.show();
  });
}

// ─── MESSAGES TAB ───────────────────────────────────────────────────────

async function loadMessagesTab() {
  const { data: messages, error } = await fetchContactMessages();
  if (error) {
    tabContent.innerHTML = `<p class="text-danger">Error: ${error.message}</p>`;
    return;
  }

  if (!messages || messages.length === 0) {
    tabContent.innerHTML = `<p class="text-muted">No messages yet.</p>`;
    return;
  }

  tabContent.innerHTML = `
    <div class="table-responsive">
      <table class="table table-striped align-middle">
        <thead>
          <tr>
            <th>Name</th>
            <th>Email</th>
            <th>Subject</th>
            <th>Message</th>
            <th>Date</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          ${messages
            .map(
              (m) => `
            <tr>
              <td>${m.name}</td>
              <td><a href="mailto:${m.email}">${m.email}</a></td>
              <td>${m.subject || "—"}</td>
              <td style="max-width:300px;white-space:pre-wrap">${m.message}</td>
              <td>${new Date(m.created_at).toLocaleDateString()}</td>
              <td>
                <button class="btn btn-sm btn-outline-danger delete-msg-btn" data-id="${m.id}">
                  <i class="bi bi-trash"></i> Delete
                </button>
              </td>
            </tr>`
            )
            .join("")}
        </tbody>
      </table>
    </div>`;

  tabContent.querySelectorAll(".delete-msg-btn").forEach((btn) => {
    btn.addEventListener("click", async () => {
      const ok = await confirmDialog("Delete this message?");
      if (!ok) return;
      const { error: delErr } = await deleteContactMessage(btn.dataset.id);
      if (delErr) {
        alert("Delete failed: " + delErr.message);
        return;
      }
      loadMessagesTab();
    });
  });
}
