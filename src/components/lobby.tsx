"use client";

import Image from "next/image";
import Link from "next/link";

import { GAME_CATALOG } from "@/domain/games";
import { modeLabel, timeControlLabel } from "@/domain/format";
import { buttonClass } from "@/lib/cx";
import { useClub } from "@/prototype/store";

import { ChallengeRow } from "./challenge-row";
import { GameCard } from "./game-card";
import { Monogram, Presence } from "./monogram";

export function Lobby() {
  const club = useClub();
  const active = club.state.matches.filter((match) => match.status === "active");
  const incoming = club.state.challenges.filter(
    (challenge) => challenge.recipientId === club.you.id && challenge.status === "pending" && challenge.expiresAt > club.now,
  );
  const outgoing = club.state.challenges.find(
    (challenge) => challenge.challengerId === club.you.id && challenge.status === "pending" && challenge.expiresAt > club.now,
  );
  const friends = club.state.friendships
    .map((friendship) => friendship.memberIds.find((id) => id !== club.you.id))
    .map((id) => (id ? club.member(id) : null))
    .filter((member) => member !== null)
    .sort((a, b) => Number(b.presence === "online") - Number(a.presence === "online") || a.displayName.localeCompare(b.displayName));
  const recent = club.state.matches.filter((match) => match.status === "complete").slice(0, 3);
  const firstName = club.you.displayName.split(" ")[0];

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-5 sm:px-6 sm:py-8">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="eyebrow">Your private table</p>
          <h1 className="mt-1 font-display text-4xl leading-none font-medium tracking-tight sm:text-5xl">
            Welcome back, {firstName}.
          </h1>
          <p className="mt-2 text-ink-soft">{lede(active.length, incoming.length)}</p>
        </div>
        <p className="font-display text-lg text-ink-soft italic sm:max-w-xs sm:text-right">
          The best games are played with good company.
        </p>
      </header>

      <section className="mt-6" aria-labelledby="games-heading">
        <div className="flex items-baseline justify-between gap-4">
          <h2 id="games-heading" className="font-display text-2xl font-medium">
            Choose a game
          </h2>
          <Link href="/games" className={buttonClass.text}>
            Explore all games
          </Link>
        </div>
        <div className="mt-3 grid gap-3 sm:grid-cols-3">
          {GAME_CATALOG.map((game) => (
            <GameCard key={game.id} game={game} />
          ))}
        </div>
      </section>

      <div className="mt-8 grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_22rem]">
        <div className="space-y-8">
          <section aria-labelledby="table-heading">
            <h2 id="table-heading" className="font-display text-2xl font-medium">
              {active.length === 0 ? "No board is out" : "Continue playing"}
            </h2>
            {active.length === 0 ? (
              <p className="mt-2 text-sm text-ink-soft">Nothing is waiting. Set up Reversi when you want a table.</p>
            ) : (
              <ul className="mt-3 space-y-3">
                {active.map((match) => {
                  const opponentId = match.darkId === club.you.id ? match.lightId : match.darkId;
                  const opponent = club.member(opponentId);
                  const yours = (match.state.toMove === "dark" ? match.darkId : match.lightId) === club.you.id;
                  return (
                    <li key={match.id} className="flex items-center gap-3 rounded-lg border border-line bg-paper-raised p-3">
                      <Image src="/art/reversi.jpg" alt="" width={128} height={128} className="size-16 shrink-0 rounded-md object-cover" />
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-semibold tracking-wide text-ink-soft uppercase">{yours ? "Your move" : "Waiting"}</p>
                        <p className="truncate font-semibold">Reversi with {opponent?.displayName ?? "a member"}</p>
                        <p className="text-sm text-ink-soft">
                          {modeLabel(match.mode)} · {timeControlLabel(match.timeControl)}
                        </p>
                      </div>
                      <Link href={`/play/${match.id}`} className={buttonClass.solid}>
                        Sit down
                      </Link>
                    </li>
                  );
                })}
              </ul>
            )}
          </section>

          <section aria-labelledby="recent-heading">
            <h2 id="recent-heading" className="font-display text-2xl font-medium">
              Recent results
            </h2>
            {recent.length === 0 ? (
              <p className="mt-2 text-sm text-ink-soft">No finished matches yet.</p>
            ) : (
              <ul className="mt-2 border-t border-line">
                {recent.map((match) => {
                  const opponentId = match.darkId === club.you.id ? match.lightId : match.darkId;
                  const opponent = club.member(opponentId);
                  return (
                    <li key={match.id} className="flex items-baseline justify-between gap-4 border-b border-line py-3">
                      <p className="min-w-0 truncate">
                        Reversi with {opponent?.displayName ?? "a member"}
                        <span className="text-ink-soft"> · {modeLabel(match.mode)}</span>
                      </p>
                      <Link href={`/play/${match.id}`} className="shrink-0 text-sm underline underline-offset-4">
                        Result
                      </Link>
                    </li>
                  );
                })}
              </ul>
            )}
          </section>
        </div>

        <div className="space-y-6">
          <section className="overflow-hidden rounded-lg border border-line bg-paper-raised" aria-labelledby="challenge-heading">
            <div className="flex items-center justify-between gap-3 bg-oxblood px-4 py-3 text-paper-raised">
              <h2 id="challenge-heading" className="font-display text-xl font-medium">
                Incoming challenges
              </h2>
              <Link href="/challenges" className="text-sm font-semibold underline underline-offset-4">
                View all
              </Link>
            </div>
            <div className="px-3 pb-3">
              {incoming.length === 0 ? (
                <p className="pt-3 text-sm text-ink-soft">No incoming challenges.</p>
              ) : (
                incoming.slice(0, 2).map((challenge) => <ChallengeRow key={challenge.id} challenge={challenge} compact />)
              )}
              {outgoing ? (
                <p className="mt-3 text-sm text-ink-soft">
                  A challenge to {club.member(outgoing.recipientId)?.displayName ?? "a friend"} is still out.{" "}
                  <Link href="/challenges" className="underline underline-offset-4">
                    Review it
                  </Link>
                  .
                </p>
              ) : null}
            </div>
          </section>

          <section aria-labelledby="room-heading">
            <div className="flex items-baseline justify-between gap-4">
              <h2 id="room-heading" className="font-display text-2xl font-medium">
                Your friends
              </h2>
              <Link href="/friends" className={buttonClass.text}>
                View all
              </Link>
            </div>
            <ul className="mt-2">
              {friends.slice(0, 4).map((friend) => (
                <li key={friend.id} className="flex flex-wrap items-center gap-2 border-b border-line py-2">
                  <Monogram name={friend.displayName} />
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-semibold">{friend.displayName}</p>
                    <Presence presence={friend.presence} />
                  </div>
                  {friend.presence === "online" ? (
                    <Link href={`/challenge/new?member=${friend.username}`} className={buttonClass.quiet}>
                      Challenge
                    </Link>
                  ) : null}
                  <Link href={`/members/${friend.username}`} className={buttonClass.quiet}>
                    Profile
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        </div>
      </div>
    </div>
  );
}

function lede(active: number, incoming: number): string {
  const parts: string[] = [];
  if (active === 1) parts.push("A board is still out.");
  if (active > 1) parts.push(`${active} boards are still out.`);
  if (incoming === 1) parts.push("Someone has challenged you.");
  if (incoming > 1) parts.push(`${incoming} challenges are waiting.`);
  if (parts.length === 0) return "The tables are clear.";
  return parts.join(" ");
}
