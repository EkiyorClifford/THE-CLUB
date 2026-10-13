import { createClient } from "@/lib/supabase/server";

export type SignedInAccount = {
  id: string;
  displayName: string;
};

/** Verified Supabase user. A cookie alone is not enough. */
export async function getSignedInAccount(): Promise<SignedInAccount | null> {
  const supabase = await createClient();
  if (!supabase) return null;

  const { data, error } = await supabase.auth.getClaims();
  const claims = data?.claims;
  const id = claims?.sub;
  if (error || typeof id !== "string" || id.length === 0) return null;

  const { data: profile } = await supabase.from("profiles").select("display_name").eq("id", id).maybeSingle();
  const email = typeof claims?.email === "string" ? claims.email : "";
  const fromEmail = email.split("@")[0] ?? "";
  const displayName =
    typeof profile?.display_name === "string" && profile.display_name.trim().length > 0
      ? profile.display_name.trim()
      : fromEmail || "Member";

  return { id, displayName };
}
