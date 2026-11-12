import { createServerClient } from "@supabase/ssr";
import { createClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";

// Who is making this request, read from the session cookie and checked with Supabase.
// Returns null when signed out or when the project keys are missing.
export async function currentUser() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  if (!url || !key) return null;
  const store = await cookies();
  const supabase = createServerClient(url, key, {
    cookies: {
      getAll: () => store.getAll(),
      // Lets Supabase renew an expired session while a Server Action runs.
      setAll: (list) => {
        for (const { name, value, options } of list) store.set(name, value, options);
      },
    },
  });
  // getClaims checks the signature of the session token on the spot when the project signs its
  // tokens with an asymmetric key, without a round trip to Supabase Auth on every action;
  // otherwise it asks Supabase Auth itself, like getUser. Either way the identity is verified.
  const { data } = await supabase.auth.getClaims();
  const id = data?.claims?.sub;
  return id ? { id } : null;
}

// Client with the service role key: it bypasses row level security, so it must only ever be
// used on the server, after checking who is asking. Null when the key is not configured.
export function adminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;
  return createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
}

// Supabase returns at most 1,000 rows per request: read page after page.
export async function readAll<Row>(page: (from: number, to: number) => PromiseLike<{ data: Row[] | null; error: unknown }>) {
  const rows: Row[] = [];
  for (let from = 0; ; from += 1000) {
    const { data, error } = await page(from, from + 999);
    if (error || !data) throw new Error("could not read the table");
    rows.push(...data);
    if (data.length < 1000) return rows;
  }
}
