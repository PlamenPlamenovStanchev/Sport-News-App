// src/pages/auth-callback.js
// ---------------------------
// Handles the OAuth redirect from Google → Supabase → this page.
//
// Supabase can return either:
//   · PKCE flow  → ?code=xxx  in the query string
//   · Implicit   → #access_token=xxx in the URL hash
//
// With `detectSessionInUrl: true` set on the Supabase client (supabaseClient.js),
// the SDK automatically detects and processes BOTH formats on the first
// getSession() call. We just wait for it and redirect.

import { supabase } from "../services/supabaseClient.js";

async function handleCallback() {
  // The Supabase client (detectSessionInUrl: true) automatically exchanges
  // the code / hash tokens into a real session when getSession() is called.
  const { data, error } = await supabase.auth.getSession();

  if (error) {
    showError(error.message);
    return;
  }

  let session = data.session;

  // If getSession() didn't pick it up yet (edge case: hash not processed),
  // wait for the onAuthStateChange SIGNED_IN event.
  if (!session) {
    session = await new Promise((resolve) => {
      const { data: listener } = supabase.auth.onAuthStateChange((event, s) => {
        if (event === "SIGNED_IN" || event === "TOKEN_REFRESHED") {
          listener.subscription.unsubscribe();
          resolve(s);
        }
      });

      // Timeout after 10 s in case the event never fires
      setTimeout(() => {
        listener.subscription.unsubscribe();
        resolve(null);
      }, 10_000);
    });
  }

  if (!session) {
    showError("Could not retrieve session. Please try signing in again.");
    return;
  }

  window.location.replace("/profile/");
}

function showError(msg) {
  const el = document.getElementById("errorMsg");
  el.textContent = `Sign-in failed: ${msg}`;
  el.classList.remove("d-none");
  console.error(msg);
}

handleCallback();
