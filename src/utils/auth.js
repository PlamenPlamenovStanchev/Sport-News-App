// src/utils/auth.js
// ------------------
// Shared authentication helpers used across page modules.

import { supabase } from "../services/supabaseClient.js";

/**
 * Get the currently logged-in user.
 * Returns null if no user is authenticated.
 *
 * @returns {Promise<object|null>}
 */
export async function getCurrentUser() {
  const { data: { user } } = await supabase.auth.getUser();
  return user;
}

/**
 * Get the profile row for the current user (includes role, username).
 *
 * @returns {Promise<{ profile: object|null, error: object|null }>}
 */
export async function getCurrentProfile() {
  const user = await getCurrentUser();
  if (!user) return { profile: null, error: null };

  const { data: profile, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  return { profile, error };
}

/**
 * Redirect to login page if the user is not authenticated.
 * Call this at the top of any protected page module.
 */
export async function requireAuth() {
  const user = await getCurrentUser();
  if (!user) {
    window.location.href = "/login/";
  }
  return user;
}

/**
 * Redirect to login page if the user does not have the required role.
 *
 * @param {string[]} allowedRoles - e.g. ["admin", "editor"]
 */
export async function requireRole(allowedRoles) {
  const { profile } = await getCurrentProfile();

  if (!profile || !allowedRoles.includes(profile.role)) {
    window.location.href = "/index.html";
    return null;
  }

  return profile;
}

/**
 * Sign out the current user and redirect to the home page.
 */
export async function logout() {
  await supabase.auth.signOut();
  window.location.href = "/index.html";
}
