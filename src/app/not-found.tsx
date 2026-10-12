import Link from "next/link";

export default function NotFound() {
  return (
    <div className="mx-auto max-w-xl px-4 py-16">
      <h1 className="font-display text-4xl font-medium">That room is not in the club.</h1>
      <p className="mt-3 text-ink-soft">The page is missing from this prototype.</p>
      <Link href="/" className="mt-6 inline-flex min-h-11 items-center bg-ink px-4 text-sm font-semibold text-paper-raised">
        Back to home
      </Link>
    </div>
  );
}
