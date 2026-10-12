"use client";

import Link from "next/link";

import { formatWhen } from "@/domain/format";
import { useClub } from "@/prototype/store";

export default function MessagesPage() {
  const club = useClub();
  const conversations = club.state.conversations.filter((conversation) => conversation.memberIds.includes(club.you.id));

  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-8 sm:px-6 sm:py-10">
      <p className="eyebrow">Correspondence</p>
      <h1 className="mt-2 font-display text-4xl font-medium tracking-tight">Messages</h1>
      <p className="mt-3 text-ink-soft">Private notes between friends. They stay in this browser for the prototype.</p>
      {conversations.length === 0 ? (
        <p className="mt-8 border-t border-line pt-4 text-ink-soft">No conversations yet. Open a friend to write.</p>
      ) : (
        <ul className="mt-8 border-t border-line">
          {conversations.map((conversation) => {
            const otherId = conversation.memberIds.find((id) => id !== club.you.id);
            const other = otherId ? club.member(otherId) : null;
            const last = conversation.messages[conversation.messages.length - 1];
            return (
              <li key={conversation.id} className="border-b border-line">
                <Link href={`/messages/${other?.username ?? ""}`} className="block py-4 hover:bg-paper-sunk">
                  <span className="flex items-baseline justify-between gap-4">
                    <span className="font-semibold">{other?.displayName ?? "A member"}</span>
                    {last ? <span className="text-sm text-ink-soft">{formatWhen(last.sentAt, club.now)}</span> : null}
                  </span>
                  <span className="mt-1 block truncate text-sm text-ink-soft">
                    {last ? last.body : "No messages yet."}
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
