export function cx(...parts: Array<string | false | null | undefined>): string {
  return parts.filter(Boolean).join(" ");
}

export const buttonClass = {
  solid:
    "inline-flex min-h-11 items-center justify-center rounded-md bg-oxblood px-4 text-sm font-semibold text-paper-raised hover:bg-ink focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink disabled:cursor-not-allowed disabled:bg-line disabled:text-ink-soft",
  quiet:
    "inline-flex min-h-11 items-center justify-center rounded-md border border-line bg-paper-raised px-4 text-sm font-semibold text-ink hover:border-ink focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink disabled:cursor-not-allowed disabled:text-ink-faint",
  text: "inline-flex min-h-11 items-center justify-center text-sm font-semibold underline decoration-line underline-offset-4 hover:decoration-ink",
} as const;
