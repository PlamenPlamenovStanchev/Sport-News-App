// src/services/newsService.js
// ----------------------------
// All Supabase calls related to news articles live here.
// Page modules import from this service — they do NOT call Supabase directly.

import { supabase } from "./supabaseClient.js";

// ─── READ ────────────────────────────────────────────────────────────────────

/**
 * Fetch a paginated list of approved (published) news articles.
 *
 * @param {object} options
 * @param {number} options.page       - Current page (1-based).
 * @param {number} options.limit      - Items per page.
 * @param {string} options.category   - Category name filter ("all" to skip).
 * @param {string} options.search     - Title search term (empty to skip).
 * @returns {Promise<{ data: object[], count: number, error: object|null }>}
 */
export async function fetchApprovedNews({ page = 1, limit = 6, category = "all", search = "" } = {}) {
  const from = (page - 1) * limit;
  const to = from + limit - 1;

  let query = supabase
    .from("news_articles")
    .select("id, title, image_url, category_id, created_at, author_id, categories(name)", { count: "exact" })
    .eq("is_published", true)
    .order("created_at", { ascending: false })
    .range(from, to);

  if (category && category !== "all") {
    // Filter by category name via the join
    query = query.eq("categories.name", category);
  }

  if (search.trim()) {
    query = query.ilike("title", `%${search.trim()}%`);
  }

  const { data, count, error } = await query;
  return { data, count, error };
}

/**
 * Fetch all categories from the categories table.
 *
 * @returns {Promise<{ data: object[]|null, error: object|null }>}
 */
export async function fetchCategories() {
  const { data, error } = await supabase
    .from("categories")
    .select("id, name")
    .order("name");

  return { data, error };
}

/**
 * Fetch all articles belonging to a specific author (any status).
 *
 * @param {string} authorId - UUID of the author.
 * @returns {Promise<{ data: object[]|null, error: object|null }>}
 */
export async function fetchMyArticles(authorId) {
  const { data, error } = await supabase
    .from("news_articles")
    .select("id, title, image_url, is_published, created_at, categories(name)")
    .eq("author_id", authorId)
    .order("created_at", { ascending: false });

  return { data, error };
}

/**
 * Fetch a single news article by ID.
 *
 * @param {string} id - UUID of the news article.
 * @returns {Promise<{ data: object|null, error: object|null }>}
 */
export async function fetchNewsById(id) {
  const { data, error } = await supabase
    .from("news_articles")
    .select("*, categories(name)")
    .eq("id", id)
    .single();

  return { data, error };
}

// ─── CREATE ───────────────────────────────────────────────────────────────────

/**
 * Upload an image to the article-images bucket and return its public URL.
 *
 * @param {File} file - The image file to upload.
 * @returns {Promise<{ url: string|null, error: object|null }>}
 */
export async function uploadArticleImage(file) {
  const fileExt = file.name.split(".").pop();
  const fileName = `${crypto.randomUUID()}.${fileExt}`;

  const { error } = await supabase.storage
    .from("article-images")
    .upload(fileName, file);

  if (error) return { url: null, error };

  const { data: urlData } = supabase.storage
    .from("article-images")
    .getPublicUrl(fileName);

  return { url: urlData.publicUrl, error: null };
}

/**
 * Create a new news article.
 * is_published defaults to FALSE — editors must approve it.
 *
 * @param {{ title: string, content: string, image_url: string|null, category_id: string, author_id: string }} article
 * @returns {Promise<{ data: object|null, error: object|null }>}
 */
export async function createNews(article) {
  const { data, error } = await supabase
    .from("news_articles")
    .insert([{ ...article, is_published: false }])
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
    .from("news_articles")
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
  const { error } = await supabase.from("news_articles").delete().eq("id", id);
  return { error };
}

// ─── STATUS (EDITOR ACTIONS) ──────────────────────────────────────────────────

/**
 * Approve a news article (set is_published = true).
 *
 * @param {string} id - UUID of the article.
 * @returns {Promise<{ error: object|null }>}
 */
export async function approveArticle(id) {
  const { error } = await supabase
    .from("news_articles")
    .update({ is_published: true })
    .eq("id", id);
  return { error };
}

/**
 * Reject / unpublish a news article (set is_published = false).
 *
 * @param {string} id - UUID of the article.
 * @returns {Promise<{ error: object|null }>}
 */
export async function rejectArticle(id) {
  const { error } = await supabase
    .from("news_articles")
    .update({ is_published: false })
    .eq("id", id);
  return { error };
}
