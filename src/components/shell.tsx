"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

import { signOut } from "@/app/sign-in/actions";
import { pendingIncomingCount } from "@/domain/challenges";
import { buttonClass, cx } from "@/lib/cx";
import { useClub } from "@/prototype/store";

import { ChallengeTray } from "./challenge-tray";

const NAV = [
  { href: "/", label: "Lobby" },
  { href: "/games", label: "Games" },
  { href: "/matches", label: "Matches" },
  { href: "/friends", label: "Friends" },
  { href: "/messages", label: "Messages" },
];

export function Shell({
  children,
  account,
}: {
  children: React.ReactNode;
  account: { displayName: string } | null;
}) {
  const pathname = usePathname();
  const club = useClub();
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
        <div className="mx-auto flex w-full max-w-6xl items-center justify-between gap-4 px-4 py-3 sm:px-6">
          <Link href="/" className="font-display text-[1.7rem] italic leading-none font-medium tracking-tight">
            The Club
          </Link>
          <div className="flex items-center gap-2 sm:gap-4">
            <button
              type="button"
              className="inline-flex min-h-11 items-center gap-2 rounded-[2px] px-2 text-sm font-semibold"
              aria-label={challengeLabel}
              aria-expanded={tray}
              onClick={() => setTray((open) => !open)}
            >
              <ChallengeMark />
              <span className="hidden sm:inline">Challenges</span>
              <span className="inline-grid min-h-6 min-w-6 place-items-center bg-oxblood px-1.5 text-xs font-semibold text-paper-raised tabular-nums">
                {incoming}
              </span>
            </button>
            {account ? (
              <div className="text-right">
                <p className="text-sm font-semibold">{account.displayName}</p>
                <p className="text-xs text-ink-soft">Sample tables stay on this device.</p>
                <form action={signOut}>
                  <button type="submit" className={buttonClass.text}>
                    Sign out
                  </button>
                </form>
              </div>
            ) : (
              <Link href="/sign-in" className={buttonClass.text}>
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

function ChallengeMark() {
  return (
    <svg width="22" height="22" viewBox="0 0 22 22" aria-hidden="true">
      <rect x="3" y="2" width="16" height="18" fill="none" stroke="currentColor" strokeWidth="1.4" />
      <path d="M7 8h8M7 12h8M7 16h5" stroke="currentColor" strokeWidth="1.4" />
    </svg>
  );
}
