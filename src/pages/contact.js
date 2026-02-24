// src/pages/contact.js
// ---------------------
// Simple contact form handler for pages/contact.html.
// For now, just shows a success message without sending data anywhere.
// Replace with a Supabase Edge Function or email service later.

const form = document.getElementById("contactForm");
const successMessage = document.getElementById("successMessage");

form.addEventListener("submit", (e) => {
  e.preventDefault();

  // Future: send form data to a Supabase Edge Function or third-party service
  successMessage.textContent = "Thanks for your message! We'll get back to you soon.";
  successMessage.classList.remove("d-none");
  form.reset();
});
