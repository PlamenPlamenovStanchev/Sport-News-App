// src/pages/login-page.js
// ------------------------
// Handles Login, Register, and Google OAuth on /login/index.html.

import { supabase } from "../services/supabaseClient.js";
import { getCurrentUser } from "../utils/auth.js";

// ─── Initialize Lucide icons ─────────────────────────────────────────────────
if (window.lucide) window.lucide.createIcons();

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

// ─── Google OAuth ─────────────────────────────────────────────────────────────
// Both the Login and Register panels share the same OAuth flow.
// Supabase creates a new account on first sign-in, or logs in an existing one.
// After Google redirects back, /auth/callback/ exchanges the code for a session
// and then sends the user to /profile/.

async function signInWithGoogle() {
  const { error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      // Supabase redirects here after Google grants access.
      // The callback page exchanges the auth code for a real session.
      redirectTo: `${window.location.origin}/auth/callback/`,
    },
  });

  if (error) {
    // Surface the error in whichever panel is visible
    const activeError =
      document.getElementById("loginPanel").classList.contains("show")
        ? document.getElementById("loginError")
        : document.getElementById("registerError");

    activeError.textContent = error.message;
    activeError.classList.remove("d-none");
  }
}

document.getElementById("googleLoginBtn").addEventListener("click", signInWithGoogle);
document.getElementById("googleRegisterBtn").addEventListener("click", signInWithGoogle);

// ─── Login Form ───────────────────────────────────────────────────────────────

const loginForm  = document.getElementById("loginForm");
const loginError = document.getElementById("loginError");
const loginBtn   = document.getElementById("loginBtn");

loginForm.addEventListener("submit", async (e) => {
  e.preventDefault();

  const email    = document.getElementById("loginEmail").value.trim();
  const password = document.getElementById("loginPassword").value;

  setLoading(loginBtn, true, "Login");
  loginError.classList.add("d-none");

  const { error } = await supabase.auth.signInWithPassword({ email, password });

  setLoading(loginBtn, false, "Login");

  if (error) {
    loginError.textContent = error.message;
    loginError.classList.remove("d-none");
    return;
  }

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

  setLoading(registerBtn, true, "Create Account");
  registerError.classList.add("d-none");
  registerSuccess.classList.add("d-none");

  const { data, error } = await supabase.auth.signUp({ email, password });

  if (error) {
    setLoading(registerBtn, false, "Create Account");
    registerError.textContent = error.message;
    registerError.classList.remove("d-none");
    return;
  }

  if (data.user) {
    const { error: profileError } = await supabase.from("profiles").insert([
      { id: data.user.id, username, role: "user" },
    ]);
    if (profileError) {
      console.error("Profile creation error:", profileError.message);
    }
  }

  setLoading(registerBtn, false, "Create Account");

  if (data.session === null) {
    registerSuccess.innerHTML =
      "Account created! <strong>Check your inbox</strong> to confirm your email, then log in.";
    registerSuccess.classList.remove("d-none");
    registerForm.reset();
    return;
  }

  window.location.href = "/profile/";
});

// ─── Helper ───────────────────────────────────────────────────────────────────

function setLoading(btn, loading, label) {
  btn.disabled = loading;
  btn.innerHTML = loading
    ? `<span class="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>Please wait…`
    : label;
}
