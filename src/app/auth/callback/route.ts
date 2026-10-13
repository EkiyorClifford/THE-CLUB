import { redirect } from "next/navigation";

import { safeNextPath } from "@/lib/auth/routes";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const next = safeNextPath(url.searchParams.get("next"));

  if (!code) {
    redirect("/sign-in?reason=callback");
  }

  const supabase = await createClient();
  if (!supabase) {
    redirect("/sign-in?reason=configuration");
  }

  const { error } = await supabase.auth.exchangeCodeForSession(code);
  if (error) {
    redirect("/sign-in?reason=callback");
  }

  redirect(next);
}
