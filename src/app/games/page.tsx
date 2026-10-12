"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { GameCard } from "@/components/game-card";
import { GAME_CATALOG } from "@/domain/games";
import { buttonClass } from "@/lib/cx";
import { useClub } from "@/prototype/store";

export default function GamesPage() {
  const club = useClub();
  const router = useRouter();
  const friends = club.state.friendships
    .map((friendship) => friendship.memberIds.find((id) => id !== club.you.id))
    .map((id) => (id ? club.member(id) : null))
    .filter((member) => member !== null);
  const [opponentId, setOpponentId] = useState(friends[0]?.id ?? "");

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-6 sm:px-6 sm:py-8">
      <p className="eyebrow">The collection</p>
      <h1 className="mt-2 font-display text-4xl font-medium tracking-tight">Games</h1>
      <p className="mt-2 max-w-xl text-ink-soft">Reversi is open. Chess and Scrabble are in the room, and they are not playable yet.</p>

      <div className="mt-6 grid gap-3 sm:grid-cols-3">
        {GAME_CATALOG.map((game) => (
          <GameCard key={game.id} game={game} />
        ))}
      </div>

      <section className="mt-8 max-w-xl border-t border-line pt-5" aria-labelledby="practice-heading">
        <h2 id="practice-heading" className="font-display text-2xl font-medium">
          Practice on this device
        </h2>
        <p className="mt-2 text-sm text-ink-soft">
          Casual and untimed Reversi with a friend at the other seat. Both seats are on this device, so this is not a
          challenge and it does not change a rating.
        </p>
        <p className="mt-3">
          <Link href="/games/reversi/practice" className={buttonClass.quiet}>
            Play vs Computer
          </Link>
        </p>
        <p className="mt-2 text-sm text-ink-soft">
          Practice against the computer is separate. It is not rated and it does not open a challenge.
        </p>
        <form
          className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-end"
          onSubmit={(event) => {
            event.preventDefault();
            const result = club.openLocalTable(opponentId);
            if (result.ok && result.matchId) router.push(`/play/${result.matchId}`);
          }}
        >
          <label className="block min-w-0 flex-1">
            <span className="text-sm font-semibold">Friend at the other seat</span>
            <select
              value={opponentId}
              onChange={(event) => setOpponentId(event.target.value)}
              className="mt-1 min-h-11 w-full border border-line bg-paper-raised px-3"
            >
              {friends.map((friend) => (
                <option key={friend.id} value={friend.id}>
                  {friend.displayName}
                </option>
              ))}
            </select>
          </label>
          <button type="submit" className={buttonClass.solid} disabled={!opponentId}>
            Open the table
          </button>
        </form>
      </section>

      <p className="mt-6">
        <Link href="/leaderboard" className={buttonClass.text}>
          Reversi ratings
        </Link>
      </p>
    </div>
  );
}
