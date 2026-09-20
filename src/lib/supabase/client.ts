import { createBrowserClient } from "@supabase/ssr";

let supabaseClientInstance: ReturnType<typeof createBrowserClient> | null = null;

export function getSupabaseBrowserClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !anonKey || anonKey === "your-anon-key-here") {
    return null;
  }

  if (!supabaseClientInstance) {
    supabaseClientInstance = createBrowserClient(url, anonKey);
  }

  return supabaseClientInstance;
}
