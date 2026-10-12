import { createBrowserClient } from "@supabase/ssr";

// Supabase client for the browser. The session lives in cookies, so the server will be able
// to read it too. Returns null until the project keys are in .env.local: the site then runs
// without accounts instead of crashing.
export function createClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  return url && key ? createBrowserClient(url, key) : null;
}
