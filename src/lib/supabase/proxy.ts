import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

import { isPublicPath, safeNextPath } from "@/lib/auth/routes";

import { readPublicSupabaseConfig } from "./config";

export async function updateSession(request: NextRequest) {
  const pathname = request.nextUrl.pathname;
  const config = readPublicSupabaseConfig(process.env);

  if (!config) {
    if (isPublicPath(pathname)) return NextResponse.next({ request });
    const url = request.nextUrl.clone();
    url.pathname = "/sign-in";
    url.searchParams.set("reason", "configuration");
    return NextResponse.redirect(url);
  }

  let supabaseResponse = NextResponse.next({ request });
  const supabase = createServerClient(config.url, config.publishableKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet, headers) {
        cookiesToSet.forEach(({ name, value }) => {
          request.cookies.set(name, value);
        });
        supabaseResponse = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) => {
          supabaseResponse.cookies.set(name, value, options);
        });
        Object.entries(headers).forEach(([key, value]) => {
          supabaseResponse.headers.set(key, value);
        });
      },
    },
  });

  const { data, error } = await supabase.auth.getClaims();
  const signedIn = !error && Boolean(data?.claims?.sub);

  if (!signedIn && !isPublicPath(pathname)) {
    const url = request.nextUrl.clone();
    url.pathname = "/sign-in";
    url.searchParams.set("next", safeNextPath(pathname));
    const redirect = NextResponse.redirect(url);
    supabaseResponse.cookies.getAll().forEach((cookie) => {
      redirect.cookies.set(cookie);
    });
    return redirect;
  }

  if (signedIn && pathname === "/sign-in") {
    const url = request.nextUrl.clone();
    url.pathname = safeNextPath(url.searchParams.get("next"));
    url.search = "";
    const redirect = NextResponse.redirect(url);
    supabaseResponse.cookies.getAll().forEach((cookie) => {
      redirect.cookies.set(cookie);
    });
    return redirect;
  }

  return supabaseResponse;
}
