export type PublicSupabaseConfig = {
  url: string;
  publishableKey: string;
};

/**
 * Public project URL and publishable key only.
 * The service-role key is intentionally not read here.
 */
export function readPublicSupabaseConfig(
  env: Record<string, string | undefined>,
): PublicSupabaseConfig | null {
  const url = env.NEXT_PUBLIC_SUPABASE_URL?.trim() ?? "";
  const publishableKey = env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY?.trim() ?? "";
  if (!url || !publishableKey) return null;
  return { url, publishableKey };
}
