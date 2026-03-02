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
  const { data, error } = await supabase.auth.signUp({ email, password });

  if (error) {
    errorMessage.textContent = error.message;
    errorMessage.classList.remove("d-none");
    return;
  }

  // 2. Insert profile row (trigger in DB may handle this automatically)
  //    Only attempt if user was created and confirmed.
  if (data.user) {
    const { error: profileError } = await supabase.from("profiles").insert([
      {
        id: data.user.id,
        username,
        role: "user",
      },
    ]);

    if (profileError) {
      console.error("Profile creation error:", profileError.message);
    }
  }

  successMessage.textContent = "Account created! Check your email to confirm your account.";
  successMessage.classList.remove("d-none");
  form.reset();
});
