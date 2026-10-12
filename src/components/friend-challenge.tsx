"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { isBlocked } from "@/domain/challenges";
import { modeLabel, timeControlLabel } from "@/domain/format";
import { relationship } from "@/domain/social";
import { TIME_CONTROLS, type Mode } from "@/domain/types";
import { buttonClass } from "@/lib/cx";
import { useClub } from "@/prototype/store";

import { GamePreview } from "./game-art";
import { MatchTerms } from "./match-terms";
import { Monogram, Presence } from "./monogram";

export function FriendChallenge({ username }: { username: string }) {
  const club = useClub();
  const router = useRouter();
  const member = club.state.members.find((item) => item.username === username) ?? null;
  const [mode, setMode] = useState<Mode>("casual");
  const [timeId, setTimeId] = useState<(typeof TIME_CONTROLS)[number]["id"]>("untimed");
  const time = TIME_CONTROLS.find((item) => item.id === timeId) ?? TIME_CONTROLS[0];
  const outgoing = club.state.challenges.some(
    (challenge) => challenge.challengerId === club.you.id && challenge.status === "pending" && challenge.expiresAt > club.now,
  );

  if (!member || member.id === club.you.id) {
    return (
      <PageFrame>
        <h1 className="font-display text-4xl font-medium">That member is not here.</h1>
        <p className="mt-3 text-ink-soft">Choose a friend from their profile.</p>
        <Link href="/friends" className={`${buttonClass.solid} mt-6`}>
          Friends
        </Link>
      </PageFrame>
    );
  }

  const kind = relationship(club.state, club.you.id, member.id);
  const blocked = isBlocked(club.state, club.you.id, member.id);
  const first = member.displayName.split(" ")[0];

  if (kind !== "friends" || blocked) {
    return (
      <PageFrame>
        <h1 className="font-display text-4xl font-medium">Challenge {first}</h1>
        <p className="mt-3 text-ink-soft">
          {blocked ? "Messages and challenges are closed between you." : "Challenges are between friends."}
        </p>
        <Link href={`/members/${member.username}`} className={`${buttonClass.solid} mt-6`}>
          Back to profile
        </Link>
      </PageFrame>
    );
  }

  return (
    <PageFrame>
      <p className="eyebrow">Challenge</p>
      <div className="mt-3 flex items-center gap-3">
        <Monogram name={member.displayName} />
        <div className="min-w-0">
          <h1 className="truncate font-display text-4xl leading-none font-medium">Challenge {first}</h1>
          <p className="mt-1 text-sm text-ink-soft">@{member.username}</p>
          <div className="mt-1">
            <Presence presence={member.presence} />
          </div>
        </div>
      </div>
      {member.presence === "offline" ? (
        <p className="mt-4 text-sm text-ink-soft">
          {first} is away. You can still send this. It expires 15 minutes after it leaves.
        </p>
      ) : null}

      <form
        className="mt-6 space-y-6"
        onSubmit={(event) => {
          event.preventDefault();
          const result = club.sendChallenge({
            recipientId: member.id,
            game: "reversi",
            mode,
            timeControl: time.timeControl,
          });
          if (result.ok) router.push("/challenges");
        }}
      >
        <section aria-label="Game">
          <p className="eyebrow">Game</p>
          <div className="mt-2 grid grid-cols-[7.5rem_minmax(0,1fr)] items-center gap-3 border border-line bg-paper-raised">
            <GamePreview game="reversi" label="Reversi board" />
            <div className="pr-3">
              <p className="font-display text-2xl font-medium">Reversi</p>
              <p className="text-sm text-ink-soft">Selected. Chess and Scrabble are not open.</p>
            </div>
          </div>
        </section>

        <MatchTerms mode={mode} timeId={timeId} onMode={setMode} onTime={setTimeId} />

        <section className="border-t border-ink pt-4" aria-label="Review">
          <h2 className="font-display text-2xl font-medium">Review</h2>
          <dl className="mt-3 grid grid-cols-2 gap-3 text-sm">
            <div>
              <dt className="text-ink-soft">Opponent</dt>
              <dd className="font-semibold">{member.displayName}</dd>
            </div>
            <div>
              <dt className="text-ink-soft">Game</dt>
              <dd className="font-semibold">Reversi</dd>
            </div>
            <div>
              <dt className="text-ink-soft">Mode</dt>
              <dd className="font-semibold">{modeLabel(mode)}</dd>
            </div>
            <div>
              <dt className="text-ink-soft">Time</dt>
              <dd className="font-semibold">{timeControlLabel(time.timeControl)}</dd>
            </div>
          </dl>
          <p className="mt-3 text-sm text-ink-soft">Expires 15 minutes after you send it. One challenge can be waiting at a time.</p>
          {outgoing ? (
            <p className="mt-3 text-sm">
              You already have a challenge waiting.{" "}
              <Link href="/challenges" className="underline underline-offset-4">
                Withdraw it
              </Link>{" "}
              before sending another.
            </p>
          ) : null}
          <button type="submit" className={`${buttonClass.solid} mt-4 w-full sm:w-auto`} disabled={outgoing}>
            Send challenge
          </button>
        </section>
      </form>
    </PageFrame>
  );
}

function PageFrame({ children }: { children: React.ReactNode }) {
  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-6 sm:px-6 sm:py-8">
      <div className="max-w-xl">{children}</div>
    </div>
  );
}
