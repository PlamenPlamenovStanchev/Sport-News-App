// tests/setup.js
// ----------------
// Global test setup for Vitest.
// Stubs import.meta.env so supabaseClient.js doesn't throw.

// Vitest with Vite already sets import.meta.env, but we need the
// VITE_ variables that supabaseClient.js reads.  We override them
// so the real env file is not required during tests.

process.env.VITE_SUPABASE_URL = "https://test.supabase.co";
process.env.VITE_SUPABASE_ANON_KEY = "test-anon-key";
