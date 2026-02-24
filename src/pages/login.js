// src/pages/login.js
// -------------------
// Handles the login form on pages/login.html.

import { supabase } from "../services/supabaseClient.js";
import { getCurrentUser } from "../utils/auth.js";

// Redirect to home if already logged in
getCurrentUser().then((user) => {
  if (user) window.location.href = "/index.html";
});

const form = document.getElementById("loginForm");
const errorMessage = document.getElementById("errorMessage");

form.addEventListener("submit", async (e) => {
  e.preventDefault();

  const email = document.getElementById("email").value.trim();
  const password = document.getElementById("password").value;

  errorMessage.classList.add("d-none");
  errorMessage.textContent = "";

  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    errorMessage.textContent = error.message;
    errorMessage.classList.remove("d-none");
    return;
  }

  // On success → go to home
  window.location.href = "/index.html";
});
