/** First word of a verified display name. Never substitutes a seeded member. */
export function greetingName(displayName: string | null | undefined): string | null {
  const trimmed = displayName?.trim() ?? "";
  if (!trimmed) return null;
  const first = trimmed.split(/\s+/)[0];
  return first && first.length > 0 ? first : null;
}

export function lobbyGreeting(displayName: string | null | undefined): string {
  const name = greetingName(displayName);
  return name ? `Welcome back, ${name}.` : "Welcome back.";
}
