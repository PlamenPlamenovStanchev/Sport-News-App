// src/pages/register.js
// ----------------------
// Handles the registration form on pages/register.html.

import { supabase } from "../services/supabaseClient.js";

// Initialize Lucide icons
if (window.lucide) window.lucide.createIcons();

const form = document.getElementById("registerForm");
const errorMessage = document.getElementById("errorMessage");
const successMessage = document.getElementById("successMessage");

form.addEventListener("submit", async (e) => {
  e.preventDefault();

  const username = document.getElementById("username").value.trim();
  const email = document.getElementById("email").value.trim();
  const password = document.getElementById("password").value;

  // Reset messages
  errorMessage.classList.add("d-none");
  successMessage.classList.add("d-none");

  // 1. Sign up with Supabase Auth
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { username },
    },
  });

  if (error) {
    errorMessage.textContent = error.message;
    errorMessage.classList.remove("d-none");
    return;
  }

  if (!data.user) {
    errorMessage.textContent = "Account could not be created. Please try again.";
    errorMessage.classList.remove("d-none");
    return;
  }

  successMessage.textContent = "Account created! Check your email to confirm your account.";
  successMessage.classList.remove("d-none");
  form.reset();
});
