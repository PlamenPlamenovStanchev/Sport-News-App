// src/services/supabaseClient.js
// ---------------------------------
// Single Supabase client instance shared across all modules.
// Replace the placeholder values below with your actual Supabase project URL and anon key.
// Never expose the service_role key on the client side.

import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = "https://your-project-id.supabase.co";
const SUPABASE_ANON_KEY = "your-anon-key-here";

// Singleton — import this wherever you need Supabase access.
export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
