import * as v from 'valibot';
import { query, command } from '$app/server';
import * as db from '$lib/server/database';

// A QUERY: type-safe, callable from any component, but only ever runs on the
// server — so it can touch the database, secrets and server-only modules safely.
export const getPosts = query(async () => {
  return db.sql`SELECT title, slug FROM post ORDER BY published_at DESC`;
});

// Arguments are validated with any Standard Schema library (Zod / Valibot),
// because the query is exposed as a real HTTP endpoint.
export const getPost = query(v.string(), async (slug) => {
  const [post] = await db.sql`SELECT * FROM post WHERE slug = ${slug}`;
  return post;
});

// query.live (May 2026): REAL-TIME data via an async generator. The client stays
// subscribed while the value is used in a component; `await time` gives the
// latest, and it re-renders on every yield.
export const getTime = query.live(async function* () {
  while (true) {
    yield new Date();
    await new Promise((r) => setTimeout(r, 1000));
  }
});

// A COMMAND mutates data; call it from an event handler. It can refresh affected
// queries in the same round-trip (single-flight mutation).
export const addLike = command(v.string(), async (id) => {
  await db.sql`UPDATE item SET likes = likes + 1 WHERE id = ${id}`;
  getPost(id).refresh();
});
