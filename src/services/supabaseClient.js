// src/services/supabaseClient.js
// ---------------------------------
// Single Supabase client instance shared across all modules.
// Replace the placeholder values below with your actual Supabase project URL and anon key.
// Never expose the service_role key on the client side.

import { createClient } from "@supabase/supabase-js";

// Values come from the .env file at the project root (never hardcoded).
// Vite exposes only variables prefixed with VITE_ to client-side code.
const SUPABASE_URL      = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  throw new Error(
    "Supabase credentials are missing. " +
    "Copy .env.example to .env and fill in VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY."
  );
}

// Singleton — import this wherever you need Supabase access.
export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    // Automatically exchange the ?code= or #access_token= in the URL
    // for a real session on any page load. Required for OAuth callbacks.
    detectSessionInUrl: true,
    // PKCE is the secure default. Supabase may still return implicit-flow
    // tokens via hash; detectSessionInUrl handles both cases.
    flowType: "pkce",
  },
});
