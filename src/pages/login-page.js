// src/pages/login-page.js
// ------------------------
// Handles both the Login and Register forms on /login/index.html.
//
// Behaviour:
//   · Already logged-in users are redirected to /profile immediately.
//   · Successful LOGIN  → redirect to /profile
//   · Successful REGISTER → if email confirmation is OFF (magic dev mode), go
//     to /profile; otherwise show a success banner telling the user to check
//     their inbox.
//   · Tab can be opened pre-selected via ?tab=register in the URL.

import { supabase } from "../services/supabaseClient.js";
import { getCurrentUser } from "../utils/auth.js";

// ─── Guard: already logged in → skip straight to profile ─────────────────────

const existingUser = await getCurrentUser();
if (existingUser) {
  window.location.replace("/profile/");
}

// ─── Pre-select tab from URL query (?tab=register) ───────────────────────────

const params = new URLSearchParams(window.location.search);
if (params.get("tab") === "register") {
  const registerTab = document.getElementById("register-tab");
  bootstrap.Tab.getOrCreateInstance(registerTab).show();
}

// ─── Tab toggle helpers ───────────────────────────────────────────────────────

document.getElementById("switchToRegister").addEventListener("click", () => {
  bootstrap.Tab.getOrCreateInstance(document.getElementById("register-tab")).show();
});

document.getElementById("switchToLogin").addEventListener("click", () => {
  bootstrap.Tab.getOrCreateInstance(document.getElementById("login-tab")).show();
});

// ─── Login Form ───────────────────────────────────────────────────────────────

const loginForm  = document.getElementById("loginForm");
const loginError = document.getElementById("loginError");
const loginBtn   = document.getElementById("loginBtn");

loginForm.addEventListener("submit", async (e) => {
  e.preventDefault();

  const email    = document.getElementById("loginEmail").value.trim();
  const password = document.getElementById("loginPassword").value;

  setLoading(loginBtn, true);
  loginError.classList.add("d-none");

  const { error } = await supabase.auth.signInWithPassword({ email, password });

  setLoading(loginBtn, false);

  if (error) {
    loginError.textContent = error.message;
    loginError.classList.remove("d-none");
    return;
  }

  // ✓ Login successful → go to Profile
  window.location.href = "/profile/";
});

// ─── Register Form ────────────────────────────────────────────────────────────

const registerForm    = document.getElementById("registerForm");
const registerError   = document.getElementById("registerError");
const registerSuccess = document.getElementById("registerSuccess");
const registerBtn     = document.getElementById("registerBtn");

registerForm.addEventListener("submit", async (e) => {
  e.preventDefault();

  const username = document.getElementById("regUsername").value.trim();
  const email    = document.getElementById("regEmail").value.trim();
  const password = document.getElementById("regPassword").value;

  if (password.length < 6) {
    registerError.textContent = "Password must be at least 6 characters.";
    registerError.classList.remove("d-none");
    return;
  }

  setLoading(registerBtn, true);
  registerError.classList.add("d-none");
  registerSuccess.classList.add("d-none");

  // 1. Create auth account
  const { data, error } = await supabase.auth.signUp({ email, password });

  if (error) {
    setLoading(registerBtn, false);
    registerError.textContent = error.message;
    registerError.classList.remove("d-none");
    return;
  }

  // 2. Insert profile row (only if user is returned and confirmed immediately)
  if (data.user) {
    const { error: profileError } = await supabase.from("profiles").insert([
      { id: data.user.id, username, role: "user" },
    ]);
    if (profileError) {
      console.error("Profile creation error:", profileError.message);
    }
  }

  setLoading(registerBtn, false);

  // 3a. Email confirmation required → show success banner
  if (data.session === null) {
    registerSuccess.innerHTML =
      "Account created! <strong>Check your inbox</strong> to confirm your email, then log in.";
    registerSuccess.classList.remove("d-none");
    registerForm.reset();
    return;
  }

  // 3b. Auto-confirm enabled (dev / "Confirm email" disabled in Supabase)
  window.location.href = "/profile/";
});

// ─── Helper: disable button + show spinner while async work runs ──────────────

function setLoading(btn, loading) {
  btn.disabled = loading;
  btn.innerHTML = loading
    ? `<span class="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>Please wait…`
    : btn.dataset.label || btn.textContent;

  // Persist original label so we can restore it
  if (!loading && !btn.dataset.label) {
    btn.dataset.label = btn.textContent;
  }
}
