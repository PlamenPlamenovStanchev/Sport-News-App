// src/pages/contact.js
// ---------------------
// Contact / Contributor application form handler.
// Inserts the form data into the contact_messages table in Supabase.

import { supabase } from "../services/supabaseClient.js";
import { showToast } from "../utils/toast.js";

const form = document.getElementById("contactForm");
const successMessage = document.getElementById("successMessage");

// Initialize Lucide icons on page load
if (window.lucide) window.lucide.createIcons();

form.addEventListener("submit", async (e) => {
  e.preventDefault();

  const name    = document.getElementById("name").value.trim();
  const email   = document.getElementById("email").value.trim();
  const role    = document.getElementById("role").value;
  const message = document.getElementById("message").value.trim();

  if (!name || !email || !role || !message) return;

  const subject = `Contributor Application — ${role}`;

  const { error } = await supabase
    .from("contact_messages")
    .insert([{ name, email, subject, message }]);

  if (error) {
    showToast("Failed to send message: " + error.message, "error");
    return;
  }

  showToast("Application submitted successfully!", "success");
  successMessage.textContent =
    "Thanks for your application! We'll review it and get back to you soon.";
  successMessage.classList.remove("d-none");
  form.reset();
});
