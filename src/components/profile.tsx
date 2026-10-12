"use client";

import Link from "next/link";

import { isBlocked } from "@/domain/challenges";
import { modeLabel } from "@/domain/format";
import { relationship, type Relationship } from "@/domain/social";
import { buttonClass } from "@/lib/cx";
import { useClub } from "@/prototype/store";

import { Monogram, Presence } from "./monogram";

export function Profile({ username }: { username: string }) {
  const club = useClub();
  const member = club.state.members.find((item) => item.username === username) ?? null;

  if (!member) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
        <h1 className="font-display text-4xl font-medium">No member by that name.</h1>
        <p className="mt-3 text-ink-soft">The prototype directory is a small sample, not a live search.</p>
        <Link href="/friends" className={`${buttonClass.solid} mt-6`}>
          Back to friends
        </Link>
      </div>
    );
  }

  const kind = relationship(club.state, club.you.id, member.id);
  const blocked = isBlocked(club.state, club.you.id, member.id);
  const blockedByYou = club.state.blocks.some((block) => block.blockerId === club.you.id && block.blockedId === member.id);
  const request = club.state.friendRequests.find(
    (item) => item.status === "pending" && item.fromId === member.id && item.toId === club.you.id,
  );
  const recent = club.state.matches.filter((match) => match.darkId === member.id || match.lightId === member.id).slice(0, 4);

  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-8 sm:px-6 sm:py-10">
      <div className="flex items-start gap-4">
        <Monogram name={member.displayName} size="lg" />
        <div className="min-w-0">
          <h1 className="break-words font-display text-4xl leading-tight font-medium">{member.displayName}</h1>
          <p className="text-ink-soft">@{member.username}</p>
          <div className="mt-2">
            <Presence presence={member.presence} />
          </div>
        </div>
      </div>

      <div className="mt-6 flex flex-col gap-2 sm:flex-row">
        <ProfileActions
          kind={kind}
          username={member.username}
          requestId={request?.id}
          otherId={member.id}
          blocked={blocked}
          blockedByYou={blockedByYou}
        />
      </div>

      <section className="mt-10" aria-labelledby="ratings-heading">
        <h2 id="ratings-heading" className="font-display text-2xl font-medium">
          Ratings
        </h2>
        <p className="mt-2 text-sm text-ink-soft">
          Sample figures from the club record. Matches in this prototype do not change them.
        </p>
        <dl className="mt-4 grid gap-4 border-t border-line sm:grid-cols-2">
          <RatingItem label="Reversi" value={member.ratings.reversi.value} games={member.ratings.reversi.games} />
          <RatingItem label="Chess" value={member.ratings.chess.value} games={member.ratings.chess.games} />
        </dl>
      </section>

      <section className="mt-10" aria-labelledby="recent-heading">
        <h2 id="recent-heading" className="font-display text-2xl font-medium">
          Recent matches
        </h2>
        {recent.length === 0 ? (
          <p className="mt-3 border-t border-line pt-3 text-ink-soft">No matches in this prototype.</p>
        ) : (
          <ul className="mt-2 border-t border-line">
            {recent.map((match) => {
              const opponentId = match.darkId === member.id ? match.lightId : match.darkId;
              const opponent = club.member(opponentId);
              return (
                <li key={match.id} className="flex items-baseline justify-between gap-4 border-b border-line py-3">
                  <p className="min-w-0 truncate">
                    With {opponent?.displayName ?? "a member"}
                    <span className="text-ink-soft"> · {modeLabel(match.mode)}</span>
                  </p>
                  <Link href={`/play/${match.id}`} className="shrink-0 text-sm underline underline-offset-4">
                    {match.status === "complete" ? "Result" : "Board"}
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </div>
  );
}

function RatingItem({ label, value, games }: { label: string; value: number; games: number }) {
  return (
    <div className="border-b border-line py-3">
      <dt className="text-sm text-ink-soft">{label}</dt>
      <dd className="font-display text-3xl tabular-nums">{games === 0 ? "Not yet rated" : value}</dd>
      <p className="text-sm text-ink-soft">{games === 0 ? "No settled games in the sample record." : `${games} sample games`}</p>
    </div>
  );
}

function ProfileActions({
  kind,
  username,
  requestId,
  otherId,
  blocked,
  blockedByYou,
}: {
  kind: Relationship;
  username: string;
  requestId?: string;
  otherId: string;
  blocked: boolean;
  blockedByYou: boolean;
}) {
  const club = useClub();
  if (kind === "self") return null;
  if (blocked) {
    return (
      <div>
        <p className="text-sm text-ink-soft">Messages and challenges are closed with this member on this device.</p>
        {blockedByYou ? (
          <button type="button" className={`${buttonClass.quiet} mt-3`} onClick={() => club.unblockMember(otherId)}>
            Unblock
          </button>
        ) : null}
      </div>
    );
  }
  if (kind === "friends") {
    return (
      <>
        <Link href={`/challenge/new?member=${username}`} className={buttonClass.solid}>
          Challenge
        </Link>
        <Link href={`/messages/${username}`} className={buttonClass.quiet}>
          Message
        </Link>
        <button type="button" className={buttonClass.text} onClick={() => club.endFriendship(otherId)}>
          End friendship
        </button>
        <button type="button" className={buttonClass.text} onClick={() => club.blockMember(otherId)}>
          Block
        </button>
      </>
    );
  }
  if (kind === "incoming" && requestId) {
    return (
      <>
        <button type="button" className={buttonClass.solid} onClick={() => club.answerFriend(requestId, true)}>
          Accept friendship
        </button>
        <button type="button" className={buttonClass.quiet} onClick={() => club.answerFriend(requestId, false)}>
          Decline
        </button>
      </>
    );
  }
  if (kind === "outgoing") {
    return <p className="text-ink-soft">Friend request sent.</p>;
  }
  return (
    <button type="button" className={buttonClass.solid} onClick={() => club.requestFriend(otherId)}>
      Request friendship
    </button>
  );
}
