"use client";

const STORAGE_KEY = "the-club-prototype-v1";

export default function ClubError({ reset }: { error: Error; reset: () => void }) {
  return (
    <main className="mx-auto max-w-xl px-4 py-16">
      <p className="font-display text-3xl italic">The Club</p>
      <h1 className="mt-6 font-display text-4xl font-medium">Something interrupted the club.</h1>
      <p className="mt-3 text-ink-soft">The local prototype data may be out of date. Restoring brings back the sample table.</p>
      <button
        type="button"
        className="mt-6 inline-flex min-h-11 items-center bg-ink px-4 text-sm font-semibold text-paper-raised"
        onClick={() => {
          sessionStorage.removeItem(STORAGE_KEY);
          reset();
        }}
      >
        Restore the sample club
      </button>
    </main>
  );
}
