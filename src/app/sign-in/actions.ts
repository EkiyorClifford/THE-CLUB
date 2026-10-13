"use server";

import { redirect } from "next/navigation";

import { safeNextPath } from "@/lib/auth/routes";
import { createClient } from "@/lib/supabase/server";

export type SignInState = {
  error: string | null;
};

export async function signIn(_state: SignInState, formData: FormData): Promise<SignInState> {
  const supabase = await createClient();
  if (!supabase) {
    return { error: "Supabase is not configured. This screen cannot sign anyone in." };
  }

  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const next = safeNextPath(String(formData.get("next") ?? ""));

  if (!email || !password) {
    return { error: "Enter the email and password from your invitation." };
  }

  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) {
    return { error: "Those details were not accepted. Accounts are created by a club administrator." };
  }

  redirect(next);
}

export async function signOut() {
  const supabase = await createClient();
  if (supabase) await supabase.auth.signOut();
  redirect("/sign-in");
}
