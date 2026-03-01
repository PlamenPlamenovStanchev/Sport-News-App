// tests/utils/auth.test.js
// --------------------------
// Unit tests for authentication utility functions.

import { describe, it, expect, vi, beforeEach } from "vitest";
import { createMockSupabase } from "../mocks/supabaseMock.js";

// ─── Mock Supabase client ────────────────────────────────────────────────────

const mockSupabase = createMockSupabase();

vi.mock("../../src/services/supabaseClient.js", () => ({
  supabase: mockSupabase,
}));

// ─── Import utils AFTER mocking ──────────────────────────────────────────────

const { getCurrentUser, getCurrentProfile, logout } = await import(
  "../../src/utils/auth.js"
);

// ─── Helpers ──────────────────────────────────────────────────────────────────

beforeEach(() => {
  mockSupabase.__reset();
  mockSupabase.auth.__user = null;
});

// ─── getCurrentUser ───────────────────────────────────────────────────────────

describe("getCurrentUser", () => {
  it("returns user object when logged in", async () => {
    mockSupabase.auth.__user = { id: "u1", email: "alice@example.com" };

    const user = await getCurrentUser();

    expect(user).toBeDefined();
    expect(user.id).toBe("u1");
    expect(user.email).toBe("alice@example.com");
  });

  it("returns null when not logged in", async () => {
    mockSupabase.auth.__user = null;

    const user = await getCurrentUser();

    expect(user).toBeNull();
  });
});

// ─── getCurrentProfile ────────────────────────────────────────────────────────

describe("getCurrentProfile", () => {
  it("returns profile with role when user is logged in", async () => {
    mockSupabase.auth.__user = { id: "u1", email: "alice@example.com" };
    // Both the profile query and roleRow query return __mockResult.data
    mockSupabase.__mockResult = { data: { id: "u1", username: "alice", role: "author" }, error: null };

    const { profile, error } = await getCurrentProfile();

    expect(error).toBeNull();
    expect(profile).toBeDefined();
    expect(profile.id).toBe("u1");
    expect(profile.username).toBe("alice");
    // role comes from the second query (user_roles). Since our mock returns
    // the same data for both, roleRow.role = "author"
    expect(profile.role).toBe("author");
  });

  it("returns null profile when not logged in", async () => {
    mockSupabase.auth.__user = null;

    const { profile, error } = await getCurrentProfile();

    expect(profile).toBeNull();
    expect(error).toBeNull();
  });

  it("falls back to email-based username when profile has no username", async () => {
    mockSupabase.auth.__user = { id: "u2", email: "bob@example.com" };
    // Profile query returns null (no profile row yet)
    mockSupabase.__mockResult = { data: null, error: null };

    const { profile } = await getCurrentProfile();

    expect(profile).toBeDefined();
    expect(profile.username).toBe("bob");
  });
});

// ─── logout ───────────────────────────────────────────────────────────────────

describe("logout", () => {
  it("calls signOut without throwing", async () => {
    // logout() calls supabase.auth.signOut() and then redirects.
    // We can't test the redirect in Node, but we verify it doesn't throw.
    // Mock window.location
    const originalLocation = globalThis.window;
    globalThis.window = { location: { href: "" } };

    await logout();

    expect(globalThis.window.location.href).toBe("/index.html");

    // Restore
    globalThis.window = originalLocation;
  });
});
