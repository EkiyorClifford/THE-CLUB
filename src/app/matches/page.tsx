"use client";

import Link from "next/link";

import { modeLabel, timeControlLabel } from "@/domain/format";
import { useClub } from "@/prototype/store";

export default function MatchesPage() {
  const club = useClub();
  const matches = club.state.matches;

  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-8 sm:px-6 sm:py-10">
      <p className="eyebrow">Your boards</p>
      <h1 className="mt-2 font-display text-4xl font-medium tracking-tight">Matches</h1>
      {matches.length === 0 ? (
        <p className="mt-6 border-t border-line pt-4 text-ink-soft">You have no matches in this prototype.</p>
      ) : (
        <ul className="mt-6 border-t border-line">
          {matches.map((match) => {
            const opponentId = match.darkId === club.you.id ? match.lightId : match.darkId;
            const opponent = club.member(opponentId);
            const yours = (match.state.toMove === "dark" ? match.darkId : match.lightId) === club.you.id;
            return (
              <li key={match.id} className="flex items-baseline justify-between gap-4 border-b border-line py-4">
                <div className="min-w-0">
                  <p className="truncate font-semibold">Reversi with {opponent?.displayName ?? "a member"}</p>
                  <p className="text-sm text-ink-soft">
                    {modeLabel(match.mode)} · {timeControlLabel(match.timeControl)} ·{" "}
                    {match.status === "complete" ? "Complete" : yours ? "Your move" : "Their move"}
                  </p>
                </div>
                <Link href={`/play/${match.id}`} className="shrink-0 text-sm underline underline-offset-4">
                  {match.status === "complete" ? "Result" : "Open"}
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
