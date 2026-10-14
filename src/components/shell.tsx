"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

import { signOut } from "@/app/sign-in/actions";
import { pendingIncomingCount } from "@/domain/challenges";
import { buttonClass, cx } from "@/lib/cx";
import { useClub } from "@/prototype/store";

import { ChallengeTray } from "./challenge-tray";
import { useSignedInAccount } from "./signed-in-account";

const NAV = [
  { href: "/", label: "Lobby" },
  { href: "/games", label: "Games" },
  { href: "/matches", label: "Matches" },
  { href: "/friends", label: "Friends" },
  { href: "/messages", label: "Messages" },
];

export function Shell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const club = useClub();
  const account = useSignedInAccount();
  const incoming = pendingIncomingCount(club.state, club.you.id, club.now);
  const [tray, setTray] = useState(false);
  const [trayPath, setTrayPath] = useState(pathname);
  if (trayPath !== pathname) {
    setTrayPath(pathname);
    setTray(false);
  }
  const challengeLabel = incoming === 1 ? "Challenges, 1 incoming" : `Challenges, ${incoming} incoming`;

  return (
    <div className="flex min-h-dvh flex-col">
      <a className="skip-link" href="#content">
        Skip to content
      </a>
      <header className="border-b border-line">
        <div className="mx-auto flex w-full max-w-6xl flex-wrap items-center justify-between gap-x-6 gap-y-3 px-4 py-3 sm:px-6">
          <Link href="/" className="font-display text-[1.7rem] italic leading-none font-medium tracking-tight">
            The Club
          </Link>
          <div className="flex min-w-0 flex-wrap items-center justify-end gap-2 sm:gap-3">
            <button
              type="button"
              className="inline-flex min-h-11 items-center gap-2 rounded-md border border-line bg-paper-raised px-3 text-sm font-semibold text-ink"
              aria-label={challengeLabel}
              aria-expanded={tray}
              onClick={() => setTray((open) => !open)}
            >
              <ChallengeIcon />
              <span>Challenges</span>
              <span className="inline-grid min-h-6 min-w-6 place-items-center rounded-full bg-oxblood px-1.5 text-xs font-semibold text-paper-raised tabular-nums">
                {incoming}
              </span>
            </button>
            {account ? (
              <div className="flex min-w-0 items-center gap-2 sm:gap-3">
                <div className="min-w-0 max-w-[9.5rem] text-right sm:max-w-[14rem]">
                  <p className="truncate text-sm font-semibold">{account.displayName}</p>
                  <p className="truncate text-xs text-ink-soft">Sample tables stay on this device.</p>
                </div>
                <form action={signOut}>
                  <button
                    type="submit"
                    className="inline-flex min-h-11 items-center gap-2 rounded-md border border-line px-3 text-sm font-semibold text-ink"
                  >
                    <SignOutIcon />
                    Sign out
                  </button>
                </form>
              </div>
            ) : (
              <Link href="/sign-in" className={buttonClass.quiet}>
                Sign in
              </Link>
            )}
          </div>
        </div>
        <nav aria-label="Club" className="mx-auto hidden w-full max-w-6xl gap-1 overflow-x-auto px-3 pb-2 sm:px-5 md:flex">
          {NAV.map((item) => {
            const active = item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={cx(
                  "inline-flex min-h-11 shrink-0 items-center px-2 text-sm",
                  active ? "font-semibold underline decoration-ink decoration-1 underline-offset-8" : "text-ink-soft",
                )}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>
      </header>
      {club.notice ? (
        <div className="border-b border-line bg-paper-sunk" role="status">
          <div className="mx-auto flex w-full max-w-6xl items-start justify-between gap-4 px-4 py-3 sm:px-6">
            <p className="text-sm">{club.notice}</p>
            <button type="button" className={buttonClass.text} onClick={club.dismissNotice}>
              Dismiss
            </button>
          </div>
        </div>
      ) : null}
      <ChallengeTray open={tray} onClose={() => setTray(false)} />
      <main id="content" className="flex-1 pb-20 md:pb-0">
        {children}
      </main>
      <nav
        aria-label="Club mobile"
        className="fixed inset-x-0 bottom-0 z-20 grid grid-cols-5 border-t border-line bg-paper md:hidden"
      >
        {NAV.map((item) => {
          const active = item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={active ? "page" : undefined}
              className={cx(
                "inline-flex min-h-14 items-center justify-center px-1 text-xs",
                active ? "font-semibold text-oxblood" : "text-ink-soft",
              )}
            >
              {item.label}
            </Link>
          );
        })}
      </nav>
      <footer className="mb-16 border-t border-line md:mb-0">
        <div className="mx-auto flex w-full max-w-6xl flex-wrap items-center gap-x-6 gap-y-2 px-4 py-5 text-sm text-ink-soft sm:px-6">
          <p>Local prototype. Games, messages, and challenges stay on this device.</p>
          <Link href="/club" className="underline decoration-line underline-offset-4 hover:decoration-ink">
            Membership
          </Link>
        </div>
      </footer>
    </div>
  );
}

function ChallengeIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true" className="shrink-0">
      <path
        d="M8 10h8M8 14h5"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
      />
      <path
        d="M6 5.5h12a2 2 0 0 1 2 2v8.2a2 2 0 0 1-2 2H11l-4.2 3.1V17.7H6a2 2 0 0 1-2-2V7.5a2 2 0 0 1 2-2Z"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function SignOutIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true" className="shrink-0">
      <path d="M10 7V5.5A1.5 1.5 0 0 1 11.5 4h7A1.5 1.5 0 0 1 20 5.5v13a1.5 1.5 0 0 1-1.5 1.5h-7A1.5 1.5 0 0 1 10 18.5V17" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
      <path d="M4 12h10M11 8.5 14.5 12 11 15.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
