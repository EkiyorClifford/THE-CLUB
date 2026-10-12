"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";

import { GAME_CATALOG } from "@/domain/games";
import { modeLabel, timeControlLabel } from "@/domain/format";
import { isBlocked } from "@/domain/challenges";
import { TIME_CONTROLS, type GameId, type Mode } from "@/domain/types";
import { buttonClass, cx } from "@/lib/cx";
import { useClub } from "@/prototype/store";

import { GamePreview } from "./game-art";
import { MatchTerms } from "./match-terms";
import { Monogram, Presence } from "./monogram";

type Step = "game" | "terms" | "people" | "review";

const STEPS: { id: Step; label: string }[] = [
  { id: "game", label: "Game" },
  { id: "terms", label: "Terms" },
  { id: "people", label: "Friend" },
  { id: "review", label: "Review" },
];

export function CreateGame({ initialGame }: { initialGame: GameId | null }) {
  const club = useClub();
  const router = useRouter();
  const [step, setStep] = useState<Step>(initialGame === "reversi" ? "terms" : "game");
  const [game, setGame] = useState<GameId | null>(initialGame === "reversi" ? "reversi" : null);
  const [closed, setClosed] = useState<GameId | null>(null);
  const [mode, setMode] = useState<Mode>("casual");
  const [timeId, setTimeId] = useState<(typeof TIME_CONTROLS)[number]["id"]>("untimed");
  const [recipientId, setRecipientId] = useState("");
  const time = TIME_CONTROLS.find((item) => item.id === timeId) ?? TIME_CONTROLS[0];

  const friends = useMemo(() => {
    return club.state.friendships
      .map((friendship) => friendship.memberIds.find((id) => id !== club.you.id))
      .map((id) => (id ? club.member(id) : null))
      .filter((member) => member !== null)
      .filter((member) => !isBlocked(club.state, club.you.id, member.id))
      .sort((a, b) => Number(b.presence === "online") - Number(a.presence === "online") || a.displayName.localeCompare(b.displayName));
  }, [club]);

  const recipient = club.member(recipientId);
  const outgoing = club.state.challenges.some(
    (challenge) => challenge.challengerId === club.you.id && challenge.status === "pending" && challenge.expiresAt > club.now,
  );
  const stepIndex = STEPS.findIndex((item) => item.id === step);

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-6 sm:px-6 sm:py-8">
      <div className="max-w-3xl">
      <p className="eyebrow">Private table</p>
      <h1 className="mt-2 font-display text-4xl font-medium tracking-tight">Create a game</h1>
      <p className="mt-2 max-w-xl text-ink-soft">Start with the game. Then the terms. Then one friend. This is not an open queue.</p>

      <ol className="mt-5 flex gap-2 overflow-x-auto text-sm" aria-label="Progress">
        {STEPS.map((item, index) => (
          <li key={item.id}>
            <button
              type="button"
              disabled={index > stepIndex}
              onClick={() => setStep(item.id)}
              className={cx("min-h-11 px-2", index === stepIndex ? "font-semibold underline underline-offset-4" : "text-ink-soft")}
            >
              {index + 1}. {item.label}
            </button>
          </li>
        ))}
      </ol>

      {step === "game" ? (
        <section className="mt-4" aria-labelledby="pick-game">
          <h2 id="pick-game" className="sr-only">
            Choose a game
          </h2>
          <div className="grid gap-3 sm:grid-cols-3">
            {GAME_CATALOG.map((entry) => {
              const open = entry.status === "playable";
              return (
                <button
                  key={entry.id}
                  type="button"
                  onClick={() => {
                    if (!open) {
                      setGame(null);
                      setClosed(entry.id);
                      return;
                    }
                    setClosed(null);
                    setGame(entry.id);
                    setStep("terms");
                  }}
                  className={cx(
                    "border bg-paper-raised text-left",
                    game === entry.id ? "border-ink" : "border-line",
                    !open && closed === entry.id ? "border-ink" : "",
                  )}
                >
                  <GamePreview game={entry.id} label="" />
                  <span className="block px-3 pt-3 font-display text-2xl font-medium">{entry.name}</span>
                  <span className="block px-3 pb-3 text-sm text-ink-soft">
                    {entry.statusLabel} · {entry.players}
                  </span>
                </button>
              );
            })}
          </div>
          {closed ? (
            <p className="mt-3 text-sm text-ink-soft">
              {GAME_CATALOG.find((entry) => entry.id === closed)?.name} cannot start a match.{" "}
              <Link href={`/games/${closed}`} className="underline underline-offset-4">
                Read the preview
              </Link>
              .
            </p>
          ) : null}
        </section>
      ) : null}

      {step === "terms" && game === "reversi" ? (
        <section className="mt-4 max-w-xl">
          <p className="text-sm text-ink-soft">Reversi · 2 players · Casual or Rated</p>
          <div className="mt-4">
            <MatchTerms mode={mode} timeId={timeId} onMode={setMode} onTime={setTimeId} />
          </div>
          <button type="button" className={`${buttonClass.solid} mt-5`} onClick={() => setStep("people")}>
            Choose a friend
          </button>
        </section>
      ) : null}

      {step === "people" ? (
        <section className="mt-4" aria-labelledby="people-heading">
          <h2 id="people-heading" className="font-display text-2xl font-medium">
            One friend
          </h2>
          <p className="mt-2 max-w-xl text-sm text-ink-soft">
            Reversi seats two friends. People outside your friends cannot be invited.{" "}
            <Link href="/games/reversi/practice" className="underline underline-offset-4">
              Play vs Computer
            </Link>{" "}
            is practice, and it is not rated.
          </p>
          {friends.length === 0 ? (
            <p className="mt-4 text-ink-soft">You need a friend before this table can be set.</p>
          ) : (
            <div className="mt-3 grid gap-2" role="radiogroup" aria-label="Friend">
              {friends.map((friend) => (
                <button
                  key={friend.id}
                  type="button"
                  role="radio"
                  aria-checked={recipientId === friend.id}
                  onClick={() => setRecipientId(friend.id)}
                  className={cx(
                    "flex min-h-11 items-center gap-3 border px-3 py-2 text-left",
                    recipientId === friend.id ? "border-ink bg-paper-sunk" : "border-line bg-paper-raised",
                  )}
                >
                  <Monogram name={friend.displayName} />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate font-semibold">{friend.displayName}</span>
                    <span className="block truncate text-sm text-ink-soft">@{friend.username}</span>
                  </span>
                  <Presence presence={friend.presence} />
                </button>
              ))}
            </div>
          )}
          <button type="button" className={`${buttonClass.solid} mt-4`} disabled={!recipientId} onClick={() => setStep("review")}>
            Review
          </button>
        </section>
      ) : null}

      {step === "review" && game === "reversi" && recipient ? (
        <section className="mt-4 max-w-xl border-t border-ink pt-4" aria-label="Review">
          <h2 className="font-display text-2xl font-medium">Review</h2>
          <dl className="mt-3 grid grid-cols-2 gap-3 text-sm">
            <div>
              <dt className="text-ink-soft">Game</dt>
              <dd className="font-semibold">Reversi</dd>
            </div>
            <div>
              <dt className="text-ink-soft">Friend</dt>
              <dd className="font-semibold">{recipient.displayName}</dd>
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
          {recipient.presence === "offline" ? (
            <p className="mt-3 text-sm text-ink-soft">
              {recipient.displayName.split(" ")[0]} is away. The invitation still expires in 15 minutes.
            </p>
          ) : null}
          <p className="mt-3 text-sm text-ink-soft">Sending creates a challenge, not a public match.</p>
          {outgoing ? (
            <p className="mt-3 text-sm">
              You already have a challenge waiting.{" "}
              <Link href="/challenges" className="underline underline-offset-4">
                Withdraw it
              </Link>{" "}
              first.
            </p>
          ) : null}
          <button
            type="button"
            className={`${buttonClass.solid} mt-4 w-full sm:w-auto`}
            disabled={outgoing}
            onClick={() => {
              const result = club.sendChallenge({
                recipientId: recipient.id,
                game: "reversi",
                mode,
                timeControl: time.timeControl,
              });
              if (result.ok) router.push("/challenges");
            }}
          >
            Send invitation
          </button>
        </section>
      ) : null}
      </div>
    </div>
  );
}
