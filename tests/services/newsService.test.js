// tests/services/newsService.test.js
// ------------------------------------
// Unit tests for the news service layer.
// We mock the Supabase client so these tests run without a real DB.

import { describe, it, expect, vi, beforeEach } from "vitest";
import { createMockSupabase } from "../mocks/supabaseMock.js";

// ─── Mock Supabase client ────────────────────────────────────────────────────

const mockSupabase = createMockSupabase();

vi.mock("../../src/services/supabaseClient.js", () => ({
  supabase: mockSupabase,
}));

// ─── Import service AFTER mocking ────────────────────────────────────────────

const {
  fetchApprovedNews,
  fetchCategories,
  fetchNewsById,
  createNews,
  updateNews,
  deleteNews,
  approveArticle,
  rejectArticle,
  fetchCommentsByArticle,
  postComment,
  countUserComments,
  toggleArticleLike,
  countArticleLikes,
  hasUserLiked,
  countUserLikes,
  toggleArticleFavourite,
  hasUserFavourited,
  fetchUserFavourites,
  recordArticleView,
  fetchMyArticles,
  fetchPendingArticles,
  fetchAllArticles,
} = await import("../../src/services/newsService.js");

// ─── Helpers ──────────────────────────────────────────────────────────────────

beforeEach(() => {
  mockSupabase.__reset();
});

// ─── fetchApprovedNews ────────────────────────────────────────────────────────

describe("fetchApprovedNews", () => {
  it("returns articles and count on success", async () => {
    const articles = [
      { id: "1", title: "Football Finals", is_published: true },
      { id: "2", title: "Tennis Open", is_published: true },
    ];
    mockSupabase.__mockResult = { data: articles, count: 2, error: null };

    const result = await fetchApprovedNews({ page: 1, limit: 6 });

    expect(result.data).toEqual(articles);
    expect(result.count).toBe(2);
    expect(result.error).toBeNull();
  });

  it("returns error when query fails", async () => {
    mockSupabase.__mockResult = { data: null, count: 0, error: { message: "DB error" } };

    const result = await fetchApprovedNews();

    expect(result.error).toBeTruthy();
    expect(result.error.message).toBe("DB error");
    expect(result.data).toBeNull();
  });

  it("uses default pagination when no options provided", async () => {
    mockSupabase.__mockResult = { data: [], count: 0, error: null };

    const result = await fetchApprovedNews();

    expect(result.data).toEqual([]);
    expect(result.count).toBe(0);
  });

  it("supports category filtering", async () => {
    const articles = [{ id: "1", title: "Basketball Update" }];
    mockSupabase.__mockResult = { data: articles, count: 1, error: null };

    const result = await fetchApprovedNews({ category: "cat-uuid-123" });

    expect(result.data).toHaveLength(1);
  });

  it("supports search by title/author", async () => {
    // When searching, the service first queries profiles then uses .or()
    // Our mock always returns __mockResult for any query, so we just
    // verify the function doesn't throw and returns the expected shape.
    mockSupabase.__mockResult = { data: [], count: 0, error: null };

    const result = await fetchApprovedNews({ search: "volleyball" });

    expect(result.data).toEqual([]);
    expect(result.error).toBeNull();
  });
});

// ─── fetchCategories ──────────────────────────────────────────────────────────

describe("fetchCategories", () => {
  it("returns list of categories", async () => {
    const categories = [
      { id: "c1", name: "Football" },
      { id: "c2", name: "Tennis" },
    ];
    mockSupabase.__mockResult = { data: categories, error: null };

    const result = await fetchCategories();

    expect(result.data).toEqual(categories);
    expect(result.error).toBeNull();
  });
});

// ─── fetchNewsById ────────────────────────────────────────────────────────────

describe("fetchNewsById", () => {
  it("returns a single article", async () => {
    const article = { id: "a1", title: "Wimbledon Preview", is_published: true };
    mockSupabase.__mockResult = { data: article, error: null };

    const result = await fetchNewsById("a1");

    expect(result.data).toEqual(article);
    expect(result.error).toBeNull();
  });

  it("returns error for non-existent article", async () => {
    mockSupabase.__mockResult = { data: null, error: { message: "Row not found" } };

    const result = await fetchNewsById("non-existent");

    expect(result.data).toBeNull();
    expect(result.error).toBeTruthy();
  });
});

// ─── createNews ───────────────────────────────────────────────────────────────

describe("createNews", () => {
  it("creates an article with is_published = false", async () => {
    const created = { id: "new-1", title: "Draft Article", is_published: false };
    mockSupabase.__mockResult = { data: created, error: null };

    const result = await createNews({
      title: "Draft Article",
      content: "Some content",
      image_url: null,
      category_id: "c1",
      author_id: "user-1",
    });

    expect(result.data).toEqual(created);
    expect(result.data.is_published).toBe(false);
    expect(result.error).toBeNull();
  });
});

// ─── updateNews ───────────────────────────────────────────────────────────────

describe("updateNews", () => {
  it("updates article fields", async () => {
    const updated = { id: "a1", title: "Updated Title" };
    mockSupabase.__mockResult = { data: updated, error: null };

    const result = await updateNews("a1", { title: "Updated Title" });

    expect(result.data.title).toBe("Updated Title");
    expect(result.error).toBeNull();
  });
});

// ─── deleteNews ───────────────────────────────────────────────────────────────

describe("deleteNews", () => {
  it("deletes article without error", async () => {
    mockSupabase.__mockResult = { error: null };

    const result = await deleteNews("a1");

    expect(result.error).toBeNull();
  });
});

// ─── approveArticle / rejectArticle ───────────────────────────────────────────

describe("approveArticle", () => {
  it("approves article without error", async () => {
    mockSupabase.__mockResult = { error: null };

    const result = await approveArticle("a1");

    expect(result.error).toBeNull();
  });
});

describe("rejectArticle", () => {
  it("rejects article without error", async () => {
    mockSupabase.__mockResult = { error: null };

    const result = await rejectArticle("a1");

    expect(result.error).toBeNull();
  });
});

// ─── fetchMyArticles ──────────────────────────────────────────────────────────

describe("fetchMyArticles", () => {
  it("returns articles for a specific author", async () => {
    const articles = [{ id: "a1", title: "My Article", author_id: "u1" }];
    mockSupabase.__mockResult = { data: articles, error: null };

    const result = await fetchMyArticles("u1");

    expect(result.data).toEqual(articles);
  });
});

// ─── fetchPendingArticles ─────────────────────────────────────────────────────

describe("fetchPendingArticles", () => {
  it("returns unpublished articles", async () => {
    const pending = [{ id: "a2", title: "Pending", is_published: false }];
    mockSupabase.__mockResult = { data: pending, error: null };

    const result = await fetchPendingArticles();

    expect(result.data).toHaveLength(1);
    expect(result.data[0].is_published).toBe(false);
  });
});

// ─── fetchAllArticles ─────────────────────────────────────────────────────────

describe("fetchAllArticles", () => {
  it("returns all articles regardless of status", async () => {
    const all = [
      { id: "a1", is_published: true },
      { id: "a2", is_published: false },
    ];
    mockSupabase.__mockResult = { data: all, error: null };

    const result = await fetchAllArticles();

    expect(result.data).toHaveLength(2);
  });
});

// ─── Comments ─────────────────────────────────────────────────────────────────

describe("fetchCommentsByArticle", () => {
  it("returns comments for an article", async () => {
    const comments = [
      { id: "c1", content: "Great!", article_id: "a1" },
      { id: "c2", content: "Nice read", article_id: "a1" },
    ];
    mockSupabase.__mockResult = { data: comments, error: null };

    const result = await fetchCommentsByArticle("a1");

    expect(result.data).toHaveLength(2);
  });
});

describe("postComment", () => {
  it("creates a comment", async () => {
    const comment = { id: "c1", content: "Hello", article_id: "a1", user_id: "u1" };
    mockSupabase.__mockResult = { data: comment, error: null };

    const result = await postComment({ article_id: "a1", user_id: "u1", content: "Hello" });

    expect(result.data.content).toBe("Hello");
    expect(result.error).toBeNull();
  });
});

describe("countUserComments", () => {
  it("returns comment count for a user", async () => {
    mockSupabase.__mockResult = { count: 5, error: null };

    const result = await countUserComments("u1");

    expect(result.count).toBe(5);
  });
});

// ─── Likes ────────────────────────────────────────────────────────────────────

describe("toggleArticleLike", () => {
  it("likes an article when not already liked", async () => {
    // First call: maybeSingle returns null (not yet liked)
    // Second call: insert succeeds
    mockSupabase.__mockResult = { data: null, error: null };

    const result = await toggleArticleLike("u1", "a1");

    // Since our mock always returns the same result, the function sees
    // existing = null → inserts → returns { liked: true }
    expect(result).toHaveProperty("liked");
    expect(result.error).toBeNull();
  });

  it("unlikes an article when already liked", async () => {
    // maybeSingle returns an existing row
    mockSupabase.__mockResult = { data: { user_id: "u1" }, error: null };

    const result = await toggleArticleLike("u1", "a1");

    expect(result).toHaveProperty("liked");
    expect(result.error).toBeNull();
  });
});

describe("countArticleLikes", () => {
  it("returns likes count for an article", async () => {
    mockSupabase.__mockResult = { count: 10, error: null };

    const result = await countArticleLikes("a1");

    expect(result.count).toBe(10);
  });
});

describe("hasUserLiked", () => {
  it("returns true when user has liked", async () => {
    mockSupabase.__mockResult = { data: { user_id: "u1" }, error: null };

    const result = await hasUserLiked("u1", "a1");

    expect(result.liked).toBe(true);
  });

  it("returns false when user has not liked", async () => {
    mockSupabase.__mockResult = { data: null, error: null };

    const result = await hasUserLiked("u1", "a1");

    expect(result.liked).toBe(false);
  });
});

describe("countUserLikes", () => {
  it("returns total likes by a user", async () => {
    mockSupabase.__mockResult = { count: 3, error: null };

    const result = await countUserLikes("u1");

    expect(result.count).toBe(3);
  });
});

// ─── Favourites ───────────────────────────────────────────────────────────────

describe("toggleArticleFavourite", () => {
  it("favourites an article when not already favourited", async () => {
    mockSupabase.__mockResult = { data: null, error: null };

    const result = await toggleArticleFavourite("u1", "a1");

    expect(result).toHaveProperty("favourited");
    expect(result.error).toBeNull();
  });

  it("unfavourites an article when already favourited", async () => {
    mockSupabase.__mockResult = { data: { user_id: "u1" }, error: null };

    const result = await toggleArticleFavourite("u1", "a1");

    expect(result).toHaveProperty("favourited");
    expect(result.error).toBeNull();
  });
});

describe("hasUserFavourited", () => {
  it("returns true when user has favourited", async () => {
    mockSupabase.__mockResult = { data: { user_id: "u1" }, error: null };

    const result = await hasUserFavourited("u1", "a1");

    expect(result.favourited).toBe(true);
  });

  it("returns false when user has not favourited", async () => {
    mockSupabase.__mockResult = { data: null, error: null };

    const result = await hasUserFavourited("u1", "a1");

    expect(result.favourited).toBe(false);
  });
});

describe("fetchUserFavourites", () => {
  it("returns list of favourited articles", async () => {
    const favs = [
      { article_id: "a1", news_articles: { id: "a1", title: "Fav 1" } },
      { article_id: "a2", news_articles: { id: "a2", title: "Fav 2" } },
    ];
    mockSupabase.__mockResult = { data: favs, error: null };

    const result = await fetchUserFavourites("u1");

    expect(result.data).toHaveLength(2);
  });
});

// ─── Views ────────────────────────────────────────────────────────────────────

describe("recordArticleView", () => {
  it("records a view without error", async () => {
    mockSupabase.__mockResult = { error: null };

    const result = await recordArticleView("u1", "a1");

    expect(result.error).toBeNull();
  });
});
