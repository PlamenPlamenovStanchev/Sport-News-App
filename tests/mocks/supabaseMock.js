// tests/mocks/supabaseMock.js
// ----------------------------
// Reusable Supabase client mock with a builder pattern that mimics
// the real Supabase JS client's chainable query interface.
//
// Usage in a test file:
//   vi.mock("../services/supabaseClient.js", () => ({ supabase: createMockSupabase() }))
//
// Then configure what a query should return:
//   supabase.__mockResult = { data: [...], count: 2, error: null };
//
// Every builder method (from, select, eq, ilike, …) returns `this`
// so chaining works.  The terminal methods (then / await) resolve
// with __mockResult.

export function createMockSupabase() {
  const builder = {
    // The result the next query will resolve with.
    __mockResult: { data: null, count: 0, error: null },

    // Reset between tests
    __reset() {
      this.__mockResult = { data: null, count: 0, error: null };
    },

    // ---- Query builder stubs (all return `this` for chaining) ----
    from()           { return this; },
    select()         { return this; },
    insert()         { return this; },
    update()         { return this; },
    upsert()         { return this; },
    delete()         { return this; },
    eq()             { return this; },
    neq()            { return this; },
    ilike()          { return this; },
    or()             { return this; },
    order()          { return this; },
    range()          { return this; },
    single()         { return this; },
    maybeSingle()    { return this; },
    limit()          { return this; },
    rpc()            { return this; },

    // ---- Storage sub-object ----
    storage: {
      from() {
        return {
          upload: async () => ({ error: null }),
          getPublicUrl: () => ({ data: { publicUrl: "https://example.com/image.png" } }),
        };
      },
    },

    // ---- Auth sub-object ----
    auth: {
      __user: null,
      getUser: async function () {
        return { data: { user: this.__user } };
      },
      signUp: async () => ({ data: { user: { id: "new-user-id" } }, error: null }),
      signOut: async () => ({}),
    },

    // Make the builder "thenable" so `await query` works.
    then(resolve) {
      return resolve(this.__mockResult);
    },
  };

  return builder;
}
