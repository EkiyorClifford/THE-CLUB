"use client";

import Link from "next/link";

import { useClub } from "@/prototype/store";

export default function LeaderboardPage() {
  const club = useClub();
  const rated = club.state.members
    .filter((member) => member.ratings.reversi.games > 0)
    .sort((a, b) => b.ratings.reversi.value - a.ratings.reversi.value || a.displayName.localeCompare(b.displayName));
  const unrated = club.state.members
    .filter((member) => member.ratings.reversi.games === 0)
    .sort((a, b) => a.displayName.localeCompare(b.displayName));

  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-8 sm:px-6 sm:py-10">
      <p className="eyebrow">Reversi</p>
      <h1 className="mt-2 font-display text-4xl font-medium tracking-tight">Ratings</h1>
      <p className="mt-3 max-w-xl text-ink-soft">
        These are sample club figures. A rated result will change them only after the server settles the match. Casual
        games never will. Players with no settled games are not ranked.
      </p>
      <ol className="mt-8 border-t border-ink">
        {rated.map((member, index) => (
          <li key={member.id} className="flex items-baseline justify-between gap-4 border-b border-line py-3">
            <p className="min-w-0">
              <span className="mr-3 tabular-nums text-ink-soft">{index + 1}</span>
              <Link href={`/members/${member.username}`} className="font-semibold hover:underline">
                {member.displayName}
              </Link>
            </p>
            <p className="tabular-nums">{member.ratings.reversi.value}</p>
          </li>
        ))}
      </ol>
      {unrated.length > 0 ? (
        <section className="mt-10">
          <h2 className="font-display text-2xl font-medium">Not yet rated</h2>
          <ul className="mt-3 border-t border-line">
            {unrated.map((member) => (
              <li key={member.id} className="border-b border-line py-3">
                <Link href={`/members/${member.username}`} className="font-semibold hover:underline">
                  {member.displayName}
                </Link>
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </div>
  );
}
