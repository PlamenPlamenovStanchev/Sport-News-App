// src/services/newsService.js
// ----------------------------
// All Supabase calls related to news articles live here.
// Page modules import from this service — they do NOT call Supabase directly.

import { supabase } from "./supabaseClient.js";

// ─── READ ────────────────────────────────────────────────────────────────────

/**
 * Fetch a paginated list of approved news articles.
 *
 * @param {object} options
 * @param {number} options.page     - Current page (1-based).
 * @param {number} options.limit    - Items per page.
 * @param {string} options.tag      - Sport tag filter ("all" to skip).
 * @param {string} options.search  - Title search term (empty to skip).
 * @returns {Promise<{ data: object[], count: number, error: object|null }>}
 */
export async function fetchApprovedNews({ page = 1, limit = 6, tag = "all", search = "" } = {}) {
  const from = (page - 1) * limit;
  const to = from + limit - 1;

  let query = supabase
    .from("news")
    .select("id, title, image_url, sport_tag, created_at, author_id", { count: "exact" })
    .eq("status", "approved")
    .order("created_at", { ascending: false })
    .range(from, to);

  if (tag && tag !== "all") {
    query = query.eq("sport_tag", tag);
  }

  if (search.trim()) {
    query = query.ilike("title", `%${search.trim()}%`);
  }

  const { data, count, error } = await query;
  return { data, count, error };
}

/**
 * Fetch a single news article by ID.
 *
 * @param {string} id - UUID of the news article.
 * @returns {Promise<{ data: object|null, error: object|null }>}
 */
export async function fetchNewsById(id) {
  const { data, error } = await supabase
    .from("news")
    .select("*")
    .eq("id", id)
    .single();

  return { data, error };
}

// ─── CREATE ───────────────────────────────────────────────────────────────────

/**
 * Create a new news article.
 * Status is always set to "pending" — editors must approve it.
 *
 * @param {{ title: string, content: string, image_url: string, sport_tag: string, author_id: string }} article
 * @returns {Promise<{ data: object|null, error: object|null }>}
 */
export async function createNews(article) {
  const { data, error } = await supabase
    .from("news")
    .insert([{ ...article, status: "pending" }])
    .select()
    .single();

  return { data, error };
}

// ─── UPDATE ───────────────────────────────────────────────────────────────────

/**
 * Update an existing news article.
 *
 * @param {string} id    - UUID of the article to update.
 * @param {object} fields - Fields to update.
 * @returns {Promise<{ data: object|null, error: object|null }>}
 */
export async function updateNews(id, fields) {
  const { data, error } = await supabase
    .from("news")
    .update(fields)
    .eq("id", id)
    .select()
    .single();

  return { data, error };
}

// ─── DELETE ───────────────────────────────────────────────────────────────────

/**
 * Delete a news article by ID.
 *
 * @param {string} id - UUID of the article to delete.
 * @returns {Promise<{ error: object|null }>}
 */
export async function deleteNews(id) {
  const { error } = await supabase.from("news").delete().eq("id", id);
  return { error };
}

// ─── STATUS (EDITOR ACTIONS) ──────────────────────────────────────────────────

/**
 * Approve or reject a news article.
 *
 * @param {string} id     - UUID of the article.
 * @param {"approved"|"rejected"} status
 * @returns {Promise<{ error: object|null }>}
 */
export async function setNewsStatus(id, status) {
  const { error } = await supabase.from("news").update({ status }).eq("id", id);
  return { error };
}
