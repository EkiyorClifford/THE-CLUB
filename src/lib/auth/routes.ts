const PUBLIC_PATHS = ["/sign-in", "/auth/callback"] as const;

/** Routes that may load without a verified session. Everything else is private. */
export function isPublicPath(pathname: string): boolean {
  return PUBLIC_PATHS.some((path) => pathname === path || pathname.startsWith(`${path}/`));
}

/** Only same-site paths. Rejects protocol-relative and off-site targets. */
export function safeNextPath(value: string | null | undefined): string {
  if (!value || !value.startsWith("/") || value.startsWith("//") || value.includes("\\")) return "/";
  return value;
}
