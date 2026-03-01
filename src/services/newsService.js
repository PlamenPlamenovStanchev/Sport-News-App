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
    .select("id, title, image_url, category_id, created_at, author_id, categories(name), article_likes(count), comments(count), article_views(count)", { count: "exact" })
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
 * Fetch all pending (unpublished) articles for editor moderation.
 *
 * @returns {Promise<{ data: object[]|null, error: object|null }>}
 */
export async function fetchPendingArticles() {
  const { data, error } = await supabase
    .from("news_articles")
    .select("id, title, content, image_url, is_published, created_at, author_id, categories(name)")
    .eq("is_published", false)
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
    .select("*, categories(name), profiles!news_articles_author_id_profiles_fk(username)")
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
 * Fetch ALL articles (any status) for admin management.
 *
 * @returns {Promise<{ data: object[]|null, error: object|null }>}
 */
export async function fetchAllArticles() {
  const { data, error } = await supabase
    .from("news_articles")
    .select("id, title, content, image_url, is_published, created_at, author_id, category_id, categories(name)")
    .order("created_at", { ascending: false });

  return { data, error };
}

/**
 * Create an article as admin (published immediately).
 *
 * @param {{ title: string, content: string, image_url: string|null, category_id: string, author_id: string }} article
 * @returns {Promise<{ data: object|null, error: object|null }>}
 */
export async function createNewsAsAdmin(article) {
  const { data, error } = await supabase
    .from("news_articles")
    .insert([{ ...article, is_published: true }])
    .select()
    .single();

  return { data, error };
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

// ─── COMMENTS ─────────────────────────────────────────────────────────────────

/**
 * Fetch all comments for a given article, newest first.
 *
 * @param {string} articleId - UUID of the article.
 * @returns {Promise<{ data: object[]|null, error: object|null }>}
 */
export async function fetchCommentsByArticle(articleId) {
  const { data, error } = await supabase
    .from("comments")
    .select("id, content, created_at, user_id, profiles!comments_user_id_profiles_fk(username)")
    .eq("article_id", articleId)
    .order("created_at", { ascending: false });

  return { data, error };
}

/**
 * Insert a new comment for an article.
 *
 * @param {{ article_id: string, user_id: string, content: string }} comment
 * @returns {Promise<{ data: object|null, error: object|null }>}
 */
export async function postComment({ article_id, user_id, content }) {
  const { data, error } = await supabase
    .from("comments")
    .insert([{ article_id, user_id, content }])
    .select()
    .single();

  return { data, error };
}

/**
 * Count total comments written by a specific user.
 *
 * @param {string} userId - UUID of the user.
 * @returns {Promise<{ count: number, error: object|null }>}
 */
export async function countUserComments(userId) {
  const { count, error } = await supabase
    .from("comments")
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId);

  return { count: count ?? 0, error };
}

// ─── LIKES ─────────────────────────────────────────────────────────────────────

/**
 * Toggle a like for the current user on an article.
 * Inserts if not liked, deletes if already liked.
 *
 * @param {string} userId    - UUID of the user.
 * @param {string} articleId - UUID of the article.
 * @returns {Promise<{ liked: boolean, error: object|null }>}
 */
export async function toggleArticleLike(userId, articleId) {
  // Check if already liked
  const { data: existing, error: selErr } = await supabase
    .from("article_likes")
    .select("user_id")
    .eq("user_id", userId)
    .eq("article_id", articleId)
    .maybeSingle();

  if (selErr) return { liked: false, error: selErr };

  if (existing) {
    // Unlike
    const { error } = await supabase
      .from("article_likes")
      .delete()
      .eq("user_id", userId)
      .eq("article_id", articleId);
    return { liked: false, error };
  } else {
    // Like
    const { error } = await supabase
      .from("article_likes")
      .insert([{ user_id: userId, article_id: articleId }]);
    return { liked: true, error };
  }
}

/**
 * Count total likes for a specific article.
 *
 * @param {string} articleId - UUID of the article.
 * @returns {Promise<{ count: number, error: object|null }>}
 */
export async function countArticleLikes(articleId) {
  const { count, error } = await supabase
    .from("article_likes")
    .select("user_id", { count: "exact", head: true })
    .eq("article_id", articleId);

  return { count: count ?? 0, error };
}

/**
 * Check whether a user has liked a specific article.
 *
 * @param {string} userId    - UUID of the user.
 * @param {string} articleId - UUID of the article.
 * @returns {Promise<{ liked: boolean, error: object|null }>}
 */
export async function hasUserLiked(userId, articleId) {
  const { data, error } = await supabase
    .from("article_likes")
    .select("user_id")
    .eq("user_id", userId)
    .eq("article_id", articleId)
    .maybeSingle();

  return { liked: !!data, error };
}

/**
 * Count total likes made by a specific user.
 *
 * @param {string} userId - UUID of the user.
 * @returns {Promise<{ count: number, error: object|null }>}
 */
export async function countUserLikes(userId) {
  const { count, error } = await supabase
    .from("article_likes")
    .select("user_id", { count: "exact", head: true })
    .eq("user_id", userId);

  return { count: count ?? 0, error };
}

// ─── FAVOURITES ─────────────────────────────────────────────────────────────────

/**
 * Toggle a favourite for the current user on an article.
 * Inserts if not favourited, deletes if already favourited.
 *
 * @param {string} userId    - UUID of the user.
 * @param {string} articleId - UUID of the article.
 * @returns {Promise<{ favourited: boolean, error: object|null }>}
 */
export async function toggleArticleFavourite(userId, articleId) {
  const { data: existing, error: selErr } = await supabase
    .from("article_favourites")
    .select("user_id")
    .eq("user_id", userId)
    .eq("article_id", articleId)
    .maybeSingle();

  if (selErr) return { favourited: false, error: selErr };

  if (existing) {
    const { error } = await supabase
      .from("article_favourites")
      .delete()
      .eq("user_id", userId)
      .eq("article_id", articleId);
    return { favourited: false, error };
  } else {
    const { error } = await supabase
      .from("article_favourites")
      .insert([{ user_id: userId, article_id: articleId }]);
    return { favourited: true, error };
  }
}

/**
 * Check whether a user has favourited a specific article.
 *
 * @param {string} userId    - UUID of the user.
 * @param {string} articleId - UUID of the article.
 * @returns {Promise<{ favourited: boolean, error: object|null }>}
 */
export async function hasUserFavourited(userId, articleId) {
  const { data, error } = await supabase
    .from("article_favourites")
    .select("user_id")
    .eq("user_id", userId)
    .eq("article_id", articleId)
    .maybeSingle();

  return { favourited: !!data, error };
}

/**
 * Fetch all articles the user has favourited, with full article data.
 *
 * @param {string} userId - UUID of the user.
 * @returns {Promise<{ data: object[]|null, error: object|null }>}
 */
export async function fetchUserFavourites(userId) {
  const { data, error } = await supabase
    .from("article_favourites")
    .select("article_id, news_articles(id, title, image_url, categories(name))")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  return { data, error };
}

// ─── VIEWS ─────────────────────────────────────────────────────────────────────

/**
 * Record that a user has read/viewed an article.
 * Uses upsert to silently ignore duplicate views.
 *
 * @param {string} userId    - UUID of the user.
 * @param {string} articleId - UUID of the article.
 * @returns {Promise<{ error: object|null }>}
 */
export async function recordArticleView(userId, articleId) {
  const { error } = await supabase
    .from("article_views")
    .upsert({ user_id: userId, article_id: articleId }, { onConflict: "user_id,article_id" });

  return { error };
}
