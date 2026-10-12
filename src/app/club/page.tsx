"use client";

import { buttonClass } from "@/lib/cx";
import { useClub } from "@/prototype/store";

export default function ClubPage() {
  const club = useClub();

  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-8 sm:px-6 sm:py-10">
      <p className="eyebrow">Membership</p>
      <h1 className="mt-2 font-display text-4xl font-medium tracking-tight">The Club</h1>
      <div className="mt-4 max-w-xl space-y-3 text-ink-soft">
        <p>You are signed in as {club.you.displayName}, a member of this private table.</p>
        <p>
          Friendship and membership are different. Finding someone by username does not open every room, and a friend
          request is not an invitation to the club.
        </p>
        <p>
          Club invitations, accounts, and authorization are not connected yet. There is no Supabase project in this
          environment, so nothing here is saved on a server.
        </p>
      </div>
      <h2 className="mt-10 font-display text-2xl font-medium">What this prototype keeps locally</h2>
      <ul className="mt-3 max-w-xl list-disc space-y-2 pl-5 text-ink-soft">
        <li>Reversi rules, including flips, passes, scores, resignation, and a local clock.</li>
        <li>Challenges that expire after 15 minutes, with one outgoing challenge at a time.</li>
        <li>Friend requests, private messages between friends, and table talk.</li>
        <li>Sample ratings that do not move when a match ends.</li>
      </ul>
      <button type="button" className={`${buttonClass.quiet} mt-8`} onClick={club.restore}>
        Restore the sample club
      </button>
    </div>
  );
}
