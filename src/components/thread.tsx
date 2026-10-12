"use client";

import Link from "next/link";
import { useState } from "react";

import { formatWhen } from "@/domain/format";
import { relationship } from "@/domain/social";
import { buttonClass } from "@/lib/cx";
import { useClub } from "@/prototype/store";

export function Thread({ username }: { username: string }) {
  const club = useClub();
  const other = club.state.members.find((member) => member.username === username) ?? null;
  const [draft, setDraft] = useState("");

  if (!other) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-10">
        <h1 className="font-display text-4xl font-medium">No member by that name.</h1>
        <Link href="/messages" className={`${buttonClass.text} mt-4`}>
          Back to messages
        </Link>
      </div>
    );
  }

  const kind = relationship(club.state, club.you.id, other.id);
  if (kind !== "friends") {
    return (
      <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
        <h1 className="font-display text-4xl font-medium">Private messages are for friends.</h1>
        <p className="mt-3 text-ink-soft">{other.displayName} is not a friend yet.</p>
        <Link href={`/members/${other.username}`} className={`${buttonClass.solid} mt-6`}>
          View profile
        </Link>
      </div>
    );
  }

  const conversation = club.state.conversations.find((item) => {
    const [left, right] = item.memberIds;
    return (left === club.you.id && right === other.id) || (left === other.id && right === club.you.id);
  });

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col px-4 py-8 sm:px-6 sm:py-10">
      <p className="text-sm text-ink-soft">
        <Link href="/messages" className="underline underline-offset-4">
          Messages
        </Link>
      </p>
      <h1 className="mt-3 font-display text-4xl font-medium">{other.displayName}</h1>
      <p className="text-ink-soft">@{other.username}</p>
      <div className="mt-6 border-t border-line pt-4">
        {!conversation || conversation.messages.length === 0 ? (
          <p className="text-ink-soft">No messages yet. What you send stays on this device.</p>
        ) : (
          <ol className="space-y-4">
            {conversation.messages.map((message) => (
              <li key={message.id}>
                <p className="text-sm text-ink-soft">
                  {club.member(message.authorId)?.displayName} · {formatWhen(message.sentAt, club.now)}
                </p>
                <p className="max-w-xl">{message.body}</p>
              </li>
            ))}
          </ol>
        )}
      </div>
      <form
        className="mt-6"
        onSubmit={(event) => {
          event.preventDefault();
          const sent = club.writeToFriend(other.id, draft);
          if (sent.ok) setDraft("");
        }}
      >
        <label htmlFor="direct-message" className="text-sm font-semibold">
          Message
        </label>
        <textarea
          id="direct-message"
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          rows={4}
          maxLength={500}
          className="mt-1 w-full border border-line bg-paper-raised px-3 py-2"
        />
        <button type="submit" className={`${buttonClass.solid} mt-3`}>
          Send
        </button>
      </form>
    </div>
  );
}
