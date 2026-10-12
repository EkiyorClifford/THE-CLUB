"use client";

import Link from "next/link";
import { useEffect, useRef } from "react";

import { buttonClass } from "@/lib/cx";
import { useClub } from "@/prototype/store";

import { ChallengeRow } from "./challenge-row";

export function ChallengeTray({ open, onClose }: { open: boolean; onClose: () => void }) {
  const club = useClub();
  const closeRef = useRef<HTMLButtonElement>(null);
  const incoming = club.state.challenges.filter(
    (challenge) => challenge.recipientId === club.you.id && challenge.status === "pending" && challenge.expiresAt > club.now,
  );

  useEffect(() => {
    if (!open) return;
    closeRef.current?.focus();
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-30">
      <button type="button" className="absolute inset-0 bg-ink/35" aria-label="Close challenges" onClick={onClose} />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="tray-title"
        className="absolute inset-x-0 bottom-16 max-h-[min(32rem,70dvh)] overflow-y-auto rounded-t-lg border border-line bg-paper-raised sm:inset-x-auto sm:top-16 sm:right-4 sm:bottom-auto sm:w-96 sm:rounded-lg md:bottom-auto"
      >
        <div className="flex items-center justify-between gap-3 bg-oxblood px-4 py-3 text-paper-raised">
          <h2 id="tray-title" className="font-display text-xl font-medium">
            Challenges
          </h2>
          <button ref={closeRef} type="button" className="min-h-11 px-2 text-sm font-semibold" onClick={onClose}>
            Close
          </button>
        </div>
        <div className="px-3 pb-3">
        {incoming.length === 0 ? (
          <p className="mt-4 text-sm text-ink-soft">No incoming challenges.</p>
        ) : (
          <div className="mt-2">
            {incoming.map((challenge) => (
              <ChallengeRow key={challenge.id} challenge={challenge} compact />
            ))}
          </div>
        )}
        <Link href="/challenges" className={`${buttonClass.text} mt-2`} onClick={onClose}>
          View all challenges
        </Link>
        </div>
      </div>
    </div>
  );
}
