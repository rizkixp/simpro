import { createBrowserClient } from "@supabase/ssr";

let supabaseClientInstance: ReturnType<typeof createBrowserClient> | null = null;

export function isSupabaseConfigured(): boolean {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  return Boolean(
    url &&
    anonKey &&
    url.startsWith("https://") &&
    anonKey !== "your-anon-key-here" &&
    anonKey.length > 20
  );
}

export function getSupabaseBrowserClient() {
  if (!isSupabaseConfigured()) {
    return null;
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

  if (!supabaseClientInstance) {
    supabaseClientInstance = createBrowserClient(url, anonKey);
  }

  return supabaseClientInstance;
}

/**
 * Standard alias for getSupabaseBrowserClient with guaranteed non-null fallback client
 */
export function createClient() {
  const existing = getSupabaseBrowserClient();
  if (existing) return existing;

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://placeholder.supabase.co";
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "placeholder-key";
  return createBrowserClient(url, anonKey);
}
