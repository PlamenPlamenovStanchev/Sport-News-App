// src/utils/toast.js
// -------------------
// Lightweight toast notification system.
// Creates a Bootstrap-compatible toast container and exposes
// showToast(message, type) for success / error / info / warning.

let container;

/**
 * Ensure the global toast container exists.
 */
function ensureContainer() {
  if (container) return;
  container = document.createElement("div");
  container.className = "toast-container position-fixed top-0 end-0 p-3";
  container.style.zIndex = "1090";
  document.body.appendChild(container);
}

/**
 * Show a toast notification.
 *
 * @param {string} message - Text to display.
 * @param {"success"|"error"|"info"|"warning"} [type="info"] - Toast type.
 * @param {number} [duration=3500] - Auto-hide delay in ms.
 */
export function showToast(message, type = "info", duration = 3500) {
  ensureContainer();

  const iconMap = {
    success: '<i data-lucide="check-circle" class="toast-icon"></i>',
    error:   '<i data-lucide="alert-circle" class="toast-icon"></i>',
    warning: '<i data-lucide="alert-triangle" class="toast-icon"></i>',
    info:    '<i data-lucide="info" class="toast-icon"></i>',
  };

  const bgMap = {
    success: "bg-success",
    error:   "bg-danger",
    warning: "bg-warning text-dark",
    info:    "bg-dark",
  };

  const id = `toast-${Date.now()}`;
  const html = `
    <div id="${id}" class="toast align-items-center text-white border-0 ${bgMap[type] || bgMap.info} toast-animate-in" role="alert" aria-live="assertive" aria-atomic="true">
      <div class="d-flex">
        <div class="toast-body d-flex align-items-center gap-2">
          ${iconMap[type] || iconMap.info}
          <span>${message}</span>
        </div>
        <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast" aria-label="Close"></button>
      </div>
    </div>
  `;

  container.insertAdjacentHTML("beforeend", html);

  const toastEl = document.getElementById(id);

  // Initialize Lucide icons inside the toast
  if (window.lucide) window.lucide.createIcons({ nodes: [toastEl] });

  const bsToast = new bootstrap.Toast(toastEl, { delay: duration });
  bsToast.show();

  // Clean up DOM after hidden
  toastEl.addEventListener("hidden.bs.toast", () => toastEl.remove());
}
