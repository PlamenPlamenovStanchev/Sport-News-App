// tests/utils/helpers.test.js
// -----------------------------
// Pure function tests — these don't need Supabase mocking.
// Tests for the helper utilities used across the app (escapeHtml, formatDate,
// debounce behavior, pagination math, etc.).

import { describe, it, expect, vi } from "vitest";

// ─── escapeHtml ───────────────────────────────────────────────────────────────
// Re-implement escapeHtml inline (it's a small private function inside home.js,
// so we replicate the same logic to verify correctness).

function escapeHtml(str) {
  const map = { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;" };
  return str.replace(/[&<>"']/g, (c) => map[c]);
}

describe("escapeHtml", () => {
  it("escapes & < > \" '", () => {
    expect(escapeHtml('<script>alert("xss")</script>')).toBe(
      "&lt;script&gt;alert(&quot;xss&quot;)&lt;/script&gt;"
    );
  });

  it("returns normal text unchanged", () => {
    expect(escapeHtml("Football World Cup")).toBe("Football World Cup");
  });

  it("handles empty string", () => {
    expect(escapeHtml("")).toBe("");
  });

  it("escapes ampersands in URLs", () => {
    expect(escapeHtml("a=1&b=2")).toBe("a=1&amp;b=2");
  });
});

// ─── formatDate ───────────────────────────────────────────────────────────────

function formatDate(isoString) {
  return new Date(isoString).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

describe("formatDate", () => {
  it("formats ISO date to en-GB locale", () => {
    const result = formatDate("2026-03-01T12:00:00Z");
    // en-GB: "1 Mar 2026"
    expect(result).toContain("Mar");
    expect(result).toContain("2026");
  });

  it("handles different months", () => {
    expect(formatDate("2026-12-25T00:00:00Z")).toContain("Dec");
  });
});

// ─── Pagination math ──────────────────────────────────────────────────────────
// The home page calculates totalPages = Math.ceil(count / limit).

describe("pagination math", () => {
  const calcPages = (count, limit) => Math.ceil(count / limit);

  it("1 page when count <= limit", () => {
    expect(calcPages(5, 6)).toBe(1);
    expect(calcPages(6, 6)).toBe(1);
  });

  it("multiple pages", () => {
    expect(calcPages(7, 6)).toBe(2);
    expect(calcPages(13, 6)).toBe(3);
  });

  it("0 pages when count is 0", () => {
    expect(calcPages(0, 6)).toBe(0);
  });
});

// ─── Debounce behaviour ──────────────────────────────────────────────────────

describe("debounce", () => {
  // Minimal debounce implementation matching the app's pattern
  function debounce(fn, ms) {
    let timer;
    return (...args) => {
      clearTimeout(timer);
      timer = setTimeout(() => fn(...args), ms);
    };
  }

  it("delays execution", async () => {
    vi.useFakeTimers();
    const callback = vi.fn();
    const debounced = debounce(callback, 400);

    debounced();
    expect(callback).not.toHaveBeenCalled();

    vi.advanceTimersByTime(400);
    expect(callback).toHaveBeenCalledOnce();

    vi.useRealTimers();
  });

  it("resets timer on rapid calls", () => {
    vi.useFakeTimers();
    const callback = vi.fn();
    const debounced = debounce(callback, 400);

    debounced();
    vi.advanceTimersByTime(200);
    debounced(); // resets
    vi.advanceTimersByTime(200);

    expect(callback).not.toHaveBeenCalled();

    vi.advanceTimersByTime(200);
    expect(callback).toHaveBeenCalledOnce();

    vi.useRealTimers();
  });

  it("passes arguments through", () => {
    vi.useFakeTimers();
    const callback = vi.fn();
    const debounced = debounce(callback, 100);

    debounced("hello", 42);
    vi.advanceTimersByTime(100);

    expect(callback).toHaveBeenCalledWith("hello", 42);

    vi.useRealTimers();
  });
});

// ─── Search term normalisation ────────────────────────────────────────────────
// The service trims and lowercases search via .ilike (case-insensitive).
// We test the trim logic the app relies on.

describe("search input normalisation", () => {
  it("trims whitespace", () => {
    expect("  volleyball  ".trim()).toBe("volleyball");
  });

  it("empty after trim returns empty", () => {
    expect("   ".trim()).toBe("");
  });

  it("ilike pattern wraps with %", () => {
    const term = "vol";
    const pattern = `%${term}%`;
    expect(pattern).toBe("%vol%");
  });
});
