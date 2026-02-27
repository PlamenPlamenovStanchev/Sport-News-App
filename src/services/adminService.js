// src/services/adminService.js
// ------------------------------
// Admin-only Supabase operations: user management.
// Uses the regular Supabase client (RLS policies on user_roles restrict
// these operations to admins only).

import { supabase } from "./supabaseClient.js";
import { createClient } from "@supabase/supabase-js";

/**
 * Create a throwaway Supabase client for signUp so the admin session
 * on the main client is not replaced by the newly created user's session.
 */
function createAnonClient() {
  return createClient(
    import.meta.env.VITE_SUPABASE_URL,
    import.meta.env.VITE_SUPABASE_ANON_KEY,
    { auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false } }
  );
}

// ─── USERS: READ ──────────────────────────────────────────────────────────────

/**
 * Fetch all users with their profiles and roles.
 * Queries profiles + user_roles (admin RLS policy grants SELECT to admins).
 *
 * @returns {Promise<{ data: object[]|null, error: object|null }>}
 */
export async function fetchAllUsers() {
  const { data: profiles, error: pErr } = await supabase
    .from("profiles")
    .select("id, username, avatar_url, created_at")
    .order("created_at", { ascending: false });

  if (pErr) return { data: null, error: pErr };

  const { data: roles, error: rErr } = await supabase
    .from("user_roles")
    .select("user_id, role");

  if (rErr) return { data: null, error: rErr };

  // Merge roles into profiles
  const roleMap = {};
  (roles || []).forEach((r) => { roleMap[r.user_id] = r.role; });

  const merged = (profiles || []).map((p) => ({
    ...p,
    role: roleMap[p.id] ?? "user",
  }));

  return { data: merged, error: null };
}

// ─── USERS: UPDATE ROLE ───────────────────────────────────────────────────────

/**
 * Update or insert a user's role.
 *
 * @param {string} userId
 * @param {string} role - One of: user, author, editor, admin
 * @returns {Promise<{ error: object|null }>}
 */
export async function updateUserRole(userId, role) {
  const { error } = await supabase
    .from("user_roles")
    .upsert({ user_id: userId, role }, { onConflict: "user_id" });

  return { error };
}

// ─── USERS: DELETE ────────────────────────────────────────────────────────────

/**
 * Fully delete a user (profile, role, AND auth.users row).
 * Calls the server-side admin_delete_user() SECURITY DEFINER function
 * which has the privileges to delete from auth.users.
 *
 * @param {string} userId
 * @returns {Promise<{ error: object|null }>}
 */
export async function deleteUserData(userId) {
  const { error } = await supabase.rpc("admin_delete_user", {
    target_user_id: userId,
  });

  return { error };
}

// ─── USERS: CREATE (via Edge Function) ────────────────────────────────────────

/**
 * Create a new user.
 * Uses a disposable Supabase client for auth.signUp so the admin's
 * session is NOT replaced by the new user's session.
 *
 * @param {{ email: string, password: string, username: string, role: string }} userData
 * @returns {Promise<{ user: object|null, error: object|null }>}
 */
export async function createUser({ email, password, username, role }) {
  // Use a separate client so the admin stays logged in
  const anonClient = createAnonClient();

  const { data: authData, error: signUpError } = await anonClient.auth.signUp({
    email,
    password,
  });

  if (signUpError) return { user: null, error: signUpError };

  const userId = authData.user?.id;
  if (!userId) return { user: null, error: { message: "Sign up succeeded but no user ID returned." } };

  // Insert profile and role using the ADMIN's client (has RLS privileges)
  await supabase.from("profiles").upsert({ id: userId, username });
  await supabase.from("user_roles").upsert({ user_id: userId, role }, { onConflict: "user_id" });

  return { user: authData.user, error: null };
}
