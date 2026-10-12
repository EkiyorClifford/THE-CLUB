"use client";

import Link from "next/link";

import { ChallengeRow } from "@/components/challenge-row";
import { modeLabel, timeControlLabel } from "@/domain/format";
import { useClub } from "@/prototype/store";
import type { Challenge } from "@/domain/types";

export default function ChallengesPage() {
  const club = useClub();
  const live = (challenge: Challenge) => challenge.status === "pending" && challenge.expiresAt > club.now;
  const incoming = club.state.challenges.filter((challenge) => challenge.recipientId === club.you.id && live(challenge));
  const sent = club.state.challenges.filter((challenge) => challenge.challengerId === club.you.id && live(challenge));
  const outcomes = club.state.challenges.filter((challenge) => !live(challenge));

  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-6 sm:px-6 sm:py-8">
      <p className="eyebrow">The tray</p>
      <h1 className="mt-2 font-display text-4xl font-medium tracking-tight">Challenges</h1>
      <p className="mt-2 max-w-xl text-ink-soft">Pending invitations last 15 minutes. You can have one outgoing challenge waiting.</p>

      <section className="mt-8" aria-labelledby="incoming-heading">
        <h2 id="incoming-heading" className="font-display text-2xl font-medium">
          Incoming
        </h2>
        {incoming.length === 0 ? (
          <p className="mt-2 text-sm text-ink-soft">Nothing is waiting on you.</p>
        ) : (
          incoming.map((challenge) => <ChallengeRow key={challenge.id} challenge={challenge} />)
        )}
      </section>

      <section className="mt-8" aria-labelledby="sent-heading">
        <h2 id="sent-heading" className="font-display text-2xl font-medium">
          Sent
        </h2>
        {sent.length === 0 ? (
          <p className="mt-2 text-sm text-ink-soft">You have no challenge waiting.</p>
        ) : (
          sent.map((challenge) => <ChallengeRow key={challenge.id} challenge={challenge} />)
        )}
      </section>

      <section className="mt-8" aria-labelledby="outcomes-heading">
        <h2 id="outcomes-heading" className="font-display text-2xl font-medium">
          Recent outcomes
        </h2>
        {outcomes.length === 0 ? (
          <p className="mt-2 text-sm text-ink-soft">No earlier challenges.</p>
        ) : (
          <ul className="mt-2 border-t border-line">
            {outcomes.map((challenge) => (
              <Outcome key={challenge.id} challenge={challenge} />
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

function Outcome({ challenge }: { challenge: Challenge }) {
  const club = useClub();
  const incoming = challenge.recipientId === club.you.id;
  const person = club.member(incoming ? challenge.challengerId : challenge.recipientId);
  return (
    <li className="flex items-baseline justify-between gap-3 border-b border-line py-3 text-sm">
      <p className="min-w-0">
        <span className="font-semibold">{person?.displayName ?? "A member"}</span>
        <span className="text-ink-soft">
          {" "}
          · Reversi · {modeLabel(challenge.mode)} · {timeControlLabel(challenge.timeControl)} · {label(challenge.status)}
        </span>
      </p>
      {challenge.matchId ? (
        <Link href={`/play/${challenge.matchId}`} className="shrink-0 underline underline-offset-4">
          Match
        </Link>
      ) : null}
    </li>
  );
}

function label(status: Challenge["status"]): string {
  switch (status) {
    case "pending":
      return "Expired";
    case "accepted":
      return "Accepted";
    case "declined":
      return "Declined";
    case "expired":
      return "Expired";
    case "cancelled":
      return "Withdrawn";
    default: {
      const unknown: never = status;
      return unknown;
    }
  }
}
