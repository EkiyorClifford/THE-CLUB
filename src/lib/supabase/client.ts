import { createBrowserClient } from "@supabase/ssr";

import { readPublicSupabaseConfig } from "./config";

export function createClient() {
  const config = readPublicSupabaseConfig({
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
  });
  if (!config) return null;
  return createBrowserClient(config.url, config.publishableKey);
}
