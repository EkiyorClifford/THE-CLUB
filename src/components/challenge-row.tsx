"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";

import { formatExpiry, modeLabel, timeControlLabel } from "@/domain/format";
import type { Challenge } from "@/domain/types";
import { initialState } from "@/games/reversi/engine";
import { buttonClass, cx } from "@/lib/cx";
import { useClub } from "@/prototype/store";

import { MiniBoard } from "./mini-board";
import { Presence } from "./monogram";

export function ChallengeRow({
  challenge,
  compact = false,
}: {
  challenge: Challenge;
  compact?: boolean;
}) {
  const router = useRouter();
  const club = useClub();
  const challenger = club.member(challenge.challengerId);
  const recipient = club.member(challenge.recipientId);
  const incoming = challenge.recipientId === club.you.id;
  const person = incoming ? challenger : recipient;
  const pending = challenge.status === "pending" && challenge.expiresAt > club.now;
  const opening = initialState().board;

  return (
    <article className={compact ? "grid grid-cols-[auto_minmax(0,1fr)] gap-3 border-t border-line py-3" : "grid gap-4 border-t border-line py-4 sm:grid-cols-[auto_minmax(0,1fr)]"}>
      <MiniBoard board={opening} label="Reversi opening" size={compact ? "sm" : "md"} />
      <div className="min-w-0">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-xs font-semibold tracking-wide text-ink-soft uppercase">{incoming ? "From" : "To"}</p>
            <h3 className={compact ? "truncate font-semibold" : "mt-1 truncate font-display text-2xl font-medium"}>
              {person ? (
                <Link href={`/members/${person.username}`} className="hover:underline">
                  {person.displayName}
                </Link>
              ) : (
                "A member"
              )}
            </h3>
          </div>
          {person && !compact ? <Presence presence={person.presence} /> : null}
        </div>
        <p className="mt-1 text-sm text-ink-soft">
          Reversi · {modeLabel(challenge.mode)} · {timeControlLabel(challenge.timeControl)}
        </p>
        <p className="text-sm tabular-nums">{pending ? formatExpiry(challenge.expiresAt, club.now) : statusLabel(challenge.status)}</p>
        {person?.presence === "offline" && pending && !compact ? (
          <p className="mt-2 max-w-md text-sm text-ink-soft">
            {person.displayName.split(" ")[0]} is away and may not see this before it expires.
          </p>
        ) : null}
        {pending ? (
          <div className={cx("mt-3 flex flex-wrap gap-2", compact ? "flex-row" : "flex-col sm:flex-row")}>
            {incoming ? (
              <>
                <button
                  type="button"
                  className={buttonClass.solid}
                  onClick={() => {
                    const result = club.acceptChallenge(challenge.id);
                    if (result.ok && result.matchId) router.push(`/play/${result.matchId}`);
                  }}
                >
                  Accept
                </button>
                <button type="button" className={buttonClass.quiet} onClick={() => club.declineChallenge(challenge.id)}>
                  Decline
                </button>
              </>
            ) : (
              <button type="button" className={buttonClass.quiet} onClick={() => club.cancelChallenge(challenge.id)}>
                Withdraw
              </button>
            )}
          </div>
        ) : challenge.matchId ? (
          <Link href={`/play/${challenge.matchId}`} className={`${buttonClass.text} mt-3`}>
            Open the match
          </Link>
        ) : null}
      </div>
    </article>
  );
}

function statusLabel(status: Challenge["status"]): string {
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
    default:
      return status;
  }
}
