// tests/services/adminService.test.js
// --------------------------------------
// Unit tests for the admin service layer.

import { describe, it, expect, vi, beforeEach } from "vitest";
import { createMockSupabase } from "../mocks/supabaseMock.js";

// ─── Mock Supabase client ────────────────────────────────────────────────────

const mockSupabase = createMockSupabase();

vi.mock("../../src/services/supabaseClient.js", () => ({
  supabase: mockSupabase,
}));

// Also mock createClient used by createAnonClient()
vi.mock("@supabase/supabase-js", () => ({
  createClient: () => ({
    auth: {
      signUp: async () => ({ data: { user: { id: "new-user-uuid" } }, error: null }),
    },
  }),
}));

// ─── Import service AFTER mocking ────────────────────────────────────────────

const {
  fetchAllUsers,
  updateUserRole,
  deleteUserData,
  createUser,
  fetchContactMessages,
  deleteContactMessage,
} = await import("../../src/services/adminService.js");

// ─── Helpers ──────────────────────────────────────────────────────────────────

beforeEach(() => {
  mockSupabase.__reset();
});

// ─── fetchAllUsers ────────────────────────────────────────────────────────────

describe("fetchAllUsers", () => {
  it("returns merged profiles with roles", async () => {
    // fetchAllUsers makes two sequential queries.  Our mock returns
    // __mockResult for both, so we get the same array for both queries.
    // We test the shape: function should return { data, error }.
    const profiles = [
      { id: "u1", username: "alice", avatar_url: null, created_at: "2026-01-01" },
      { id: "u2", username: "bob", avatar_url: null, created_at: "2026-01-02" },
    ];
    mockSupabase.__mockResult = { data: profiles, error: null };

    const result = await fetchAllUsers();

    expect(result.error).toBeNull();
    expect(result.data).toBeDefined();
    // Each merged user should have a role key (defaults to "user" when
    // the role map lookup returns undefined)
    result.data.forEach((u) => {
      expect(u).toHaveProperty("role");
    });
  });

  it("returns error when profiles query fails", async () => {
    mockSupabase.__mockResult = { data: null, error: { message: "Permission denied" } };

    const result = await fetchAllUsers();

    expect(result.error).toBeTruthy();
    expect(result.data).toBeNull();
  });
});

// ─── updateUserRole ───────────────────────────────────────────────────────────

describe("updateUserRole", () => {
  it("upserts a role without error", async () => {
    mockSupabase.__mockResult = { error: null };

    const result = await updateUserRole("u1", "editor");

    expect(result.error).toBeNull();
  });

  it("returns error on failure", async () => {
    mockSupabase.__mockResult = { error: { message: "upsert failed" } };

    const result = await updateUserRole("u1", "admin");

    expect(result.error).toBeTruthy();
  });
});

// ─── deleteUserData ───────────────────────────────────────────────────────────

describe("deleteUserData", () => {
  it("calls rpc and returns no error on success", async () => {
    mockSupabase.__mockResult = { error: null };

    const result = await deleteUserData("u1");

    expect(result.error).toBeNull();
  });

  it("returns error when rpc fails", async () => {
    mockSupabase.__mockResult = { error: { message: "rpc error" } };

    const result = await deleteUserData("u1");

    expect(result.error.message).toBe("rpc error");
  });
});

// ─── createUser ───────────────────────────────────────────────────────────────

describe("createUser", () => {
  it("creates a user and returns user object", async () => {
    // The insert/upsert calls for profile + role go through mockSupabase
    mockSupabase.__mockResult = { error: null };

    const result = await createUser({
      email: "test@example.com",
      password: "password123",
      username: "testuser",
      role: "author",
    });

    expect(result.user).toBeDefined();
    expect(result.user.id).toBe("new-user-uuid");
    expect(result.error).toBeNull();
  });
});

// ─── Contact Messages ─────────────────────────────────────────────────────────

describe("fetchContactMessages", () => {
  it("returns list of messages", async () => {
    const messages = [
      { id: "m1", name: "Alice", email: "alice@test.com", subject: "Contributor Application — Author", message: "I want to write!" },
      { id: "m2", name: "Bob", email: "bob@test.com", subject: "Contributor Application — Editor", message: "I want to edit!" },
    ];
    mockSupabase.__mockResult = { data: messages, error: null };

    const result = await fetchContactMessages();

    expect(result.data).toHaveLength(2);
    expect(result.error).toBeNull();
  });

  it("returns error on failure", async () => {
    mockSupabase.__mockResult = { data: null, error: { message: "forbidden" } };

    const result = await fetchContactMessages();

    expect(result.error).toBeTruthy();
  });
});

describe("deleteContactMessage", () => {
  it("deletes a message without error", async () => {
    mockSupabase.__mockResult = { error: null };

    const result = await deleteContactMessage("m1");

    expect(result.error).toBeNull();
  });
});
