"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

import { isBlocked } from "@/domain/challenges";
import { relationship } from "@/domain/social";
import { buttonClass } from "@/lib/cx";
import { useClub } from "@/prototype/store";

import { Monogram, Presence } from "@/components/monogram";

export default function FriendsPage() {
  const club = useClub();
  const [query, setQuery] = useState("");
  const friends = club.state.members.filter((member) => relationship(club.state, club.you.id, member.id) === "friends");
  const requests = club.state.friendRequests.filter((request) => request.status === "pending" && request.toId === club.you.id);
  const directory = useMemo(() => {
    const needle = query.trim().toLowerCase().replace(/^@/, "");
    if (!needle) return [];
    return club.state.members.filter(
      (member) =>
        member.id !== club.you.id &&
        (member.username.includes(needle) || member.displayName.toLowerCase().includes(needle)),
    );
  }, [club, query]);

  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-8 sm:px-6 sm:py-10">
      <p className="eyebrow">Members</p>
      <h1 className="mt-2 font-display text-4xl font-medium tracking-tight">Friends</h1>
      <p className="mt-3 text-ink-soft">Find people by username. A friendship starts only after they accept.</p>

      <form className="mt-6" onSubmit={(event) => event.preventDefault()}>
        <label htmlFor="member-search" className="text-sm font-semibold">
          Find a member
        </label>
        <input
          id="member-search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Username"
          className="mt-1 min-h-11 w-full border border-line bg-paper-raised px-3"
        />
      </form>
      {query.trim() ? (
        directory.length === 0 ? (
          <p className="mt-3 text-sm text-ink-soft">No member by that name is in this prototype directory.</p>
        ) : (
          <ul className="mt-3 border-t border-line">
            {directory.map((member) => {
              const kind = relationship(club.state, club.you.id, member.id);
              return (
                <li key={member.id} className="flex items-center gap-3 border-b border-line py-2">
                  <Monogram name={member.displayName} />
                  <div className="min-w-0 flex-1">
                    <Link href={`/members/${member.username}`} className="font-semibold hover:underline">
                      {member.displayName}
                    </Link>
                    <p className="text-sm text-ink-soft">@{member.username}</p>
                  </div>
                  {kind === "friends" ? <span className="text-sm text-ink-soft">Friend</span> : null}
                </li>
              );
            })}
          </ul>
        )
      ) : null}

      <section className="mt-10" aria-labelledby="requests-heading">
        <h2 id="requests-heading" className="font-display text-2xl font-medium">
          Requests
        </h2>
        {requests.length === 0 ? (
          <p className="mt-3 border-t border-line pt-3 text-ink-soft">No friend requests are waiting.</p>
        ) : (
          <ul className="mt-2 border-t border-line">
            {requests.map((request) => {
              const from = club.member(request.fromId);
              if (!from) return null;
              return (
                <li key={request.id} className="flex flex-col gap-3 border-b border-line py-4 sm:flex-row sm:items-center">
                  <Monogram name={from.displayName} />
                  <div className="min-w-0 flex-1">
                    <Link href={`/members/${from.username}`} className="font-semibold">
                      {from.displayName}
                    </Link>
                    <p className="text-sm text-ink-soft">@{from.username}</p>
                  </div>
                  <div className="flex gap-2">
                    <button type="button" className={buttonClass.solid} onClick={() => club.answerFriend(request.id, true)}>
                      Accept
                    </button>
                    <button type="button" className={buttonClass.quiet} onClick={() => club.answerFriend(request.id, false)}>
                      Decline
                    </button>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      <section className="mt-10" aria-labelledby="friends-heading">
        <h2 id="friends-heading" className="font-display text-2xl font-medium">
          Your friends
        </h2>
        <ul className="mt-2 border-t border-line">
          {friends.map((friend) => {
            const blocked = isBlocked(club.state, club.you.id, friend.id);
            return (
              <li key={friend.id} className="flex flex-wrap items-center gap-3 border-b border-line py-2">
                <Monogram name={friend.displayName} />
                <div className="min-w-0 flex-1">
                  <Link href={`/members/${friend.username}`} className="block truncate font-semibold">
                    {friend.displayName}
                  </Link>
                  <p className="text-sm text-ink-soft">@{friend.username}</p>
                </div>
                <Presence presence={friend.presence} />
                {blocked ? <span className="text-sm text-ink-soft">Blocked</span> : null}
                <div className="flex w-full gap-2 sm:w-auto">
                  {blocked ? null : (
                    <Link href={`/challenge/new?member=${friend.username}`} className={buttonClass.quiet}>
                      Challenge
                    </Link>
                  )}
                  <Link href={`/members/${friend.username}`} className={buttonClass.quiet}>
                    Profile
                  </Link>
                  <button type="button" className={buttonClass.text} onClick={() => club.endFriendship(friend.id)}>
                    Remove
                  </button>
                </div>
              </li>
            );
          })}
        </ul>
      </section>
    </div>
  );
}
