import { createClient, type SupabaseClient } from "@supabase/supabase-js";

let client: SupabaseClient | null = null;

// This function ONLY runs in the browser.
// It prevents Supabase from being created during build or server evaluation.
export function getSupabaseBrowserClient() {
  if (typeof window === "undefined") {
    throw new Error("Supabase browser client was called on the server");
  }

  if (client) return client;

  // In App Router, modules can be evaluated during build/prerender and on the server.
  // If env vars are read too early (or the client is created at module scope),
  // it can crash Vercel builds when /activate is prerendered.
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url) throw new Error("NEXT_PUBLIC_SUPABASE_URL is missing");
  if (!anon) throw new Error("NEXT_PUBLIC_SUPABASE_ANON_KEY is missing");

  // Creating the Supabase client lazily (and memoizing it) protects production deployments,
  // and is the correct pattern for client pages/components in the Next.js App Router.
  client = createClient(url, anon);
  return client;
}
