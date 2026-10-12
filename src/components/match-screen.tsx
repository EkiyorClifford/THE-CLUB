"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { discLabel, formatClock, formatWhen, modeLabel, timeControlLabel } from "@/domain/format";
import { discFor, seatId, timeLeft } from "@/domain/matches";
import { score, type Disc } from "@/games/reversi/engine";
import { buttonClass, cx } from "@/lib/cx";
import { useClub } from "@/prototype/store";

import { ReversiBoard } from "./reversi-board";

export function MatchScreen({ matchId }: { matchId: string }) {
  const router = useRouter();
  const club = useClub();
  const match = club.state.matches.find((item) => item.id === matchId);
  const [confirmResign, setConfirmResign] = useState(false);
  const [draft, setDraft] = useState("");
  const [panel, setPanel] = useState<"moves" | "talk" | "table">("moves");

  if (!match) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
        <h1 className="font-display text-4xl font-medium">This table is not set.</h1>
        <p className="mt-3 text-ink-soft">It is not in the local prototype.</p>
        <Link href="/" className={`${buttonClass.solid} mt-6`}>
          Back to home
        </Link>
      </div>
    );
  }

  const youDisc = discFor(match, club.you.id);
  const otherId = match.darkId === club.you.id ? match.lightId : match.darkId;
  const other = club.member(otherId);
  const tally = score(match.state.board);
  const bothPresent = match.present.dark && match.present.light;
  const complete = match.status === "complete";
  const sideToMove = match.state.toMove;
  const moverId = seatId(match, sideToMove);
  const mover = club.member(moverId);

  return (
    <div className="bg-felt-deep text-disc-light">
      <div className="mx-auto grid w-full max-w-6xl items-start lg:grid-cols-[minmax(0,1fr)_22rem]">
        <div className="min-w-0 px-4 py-5 sm:px-6">
          <p className="text-sm text-disc-light/80">
            <Link href="/" className="underline underline-offset-4">
              Lobby
            </Link>
            <span aria-hidden="true"> / </span>
            Reversi
          </p>
          <h1 className="mt-2 font-display text-4xl font-medium tracking-tight">Reversi</h1>
          <p className="mt-1 text-disc-light/80">
            {modeLabel(match.mode)} · {timeControlLabel(match.timeControl)}
          </p>

          {complete && match.result ? (
            <ResultBlock
              winnerName={winnerName(match.result.winner, match.darkId, match.lightId, club.member)}
              scoreLabel={`${tally.dark} to ${tally.light}`}
              reason={match.result.reason}
              mode={match.mode}
              bothPresent={bothPresent}
              rematch={match.rematch}
              youId={club.you.id}
              otherId={otherId}
              otherName={other?.displayName ?? "The other player"}
              onRequest={() => club.requestRematch(match.id, club.you.id)}
              onWithdraw={() => club.withdrawRematch(match.id)}
              onAnswer={(actorId, accept) => {
                const result = club.answerRematch(match.id, actorId, accept);
                if (result.ok && result.matchId) router.push(`/play/${result.matchId}`);
              }}
              nextMatchId={match.rematch?.nextMatchId}
            />
          ) : null}

          <div className="mt-6 grid grid-cols-2 gap-3 border-y border-line py-4" aria-live="polite">
            <Seat
              name={club.member(match.darkId)?.displayName ?? "Dark"}
              disc="dark"
              score={tally.dark}
              clock={timeLeft(match, "dark", club.now)}
              active={!complete && sideToMove === "dark"}
              present={match.present.dark}
              align="left"
            />
            <Seat
              name={club.member(match.lightId)?.displayName ?? "Light"}
              disc="light"
              score={tally.light}
              clock={timeLeft(match, "light", club.now)}
              active={!complete && sideToMove === "light"}
              present={match.present.light}
              align="right"
            />
          </div>

          {!complete ? (
            <p className="mt-4 text-sm text-disc-light/75">
              {match.state.log.length === 0
                ? "The board is set. Dark moves first."
                : `${mover?.displayName ?? "The side to move"} to move.`}{" "}
              {match.timeControl.kind === "sudden-death"
                ? "A clock that reaches zero loses the match."
                : "Untimed. The board stays until someone returns."}
            </p>
          ) : null}

          <div className="mx-auto mt-4 w-full max-w-[40rem]">
            <ReversiBoard state={match.state} disabled={complete} onMove={(square) => club.playMove(match.id, square)} />
          </div>
          <p className="mt-2 text-sm text-disc-light/70">Arrow keys move between squares. Enter plays a legal move.</p>
          <div className="mt-4 grid grid-cols-3 gap-2 lg:hidden" role="tablist" aria-label="Table">
            {(
              [
                ["moves", "Moves"],
                ["table", "Resign"],
                ["talk", "Chat"],
              ] as const
            ).map(([id, label]) => (
              <button
                key={id}
                type="button"
                role="tab"
                aria-selected={panel === id}
                className={cx(
                  "min-h-11 rounded-md text-sm font-semibold",
                  panel === id ? "bg-disc-light text-felt-deep" : "border border-felt-line text-disc-light",
                )}
                onClick={() => setPanel(id)}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        <aside className="space-y-8 bg-paper px-4 py-5 text-ink sm:px-6 lg:py-8">
          <section aria-labelledby="moves-heading" className={panel === "moves" ? "" : "max-lg:hidden"}>
            <h2 id="moves-heading" className="font-display text-2xl font-medium">
              Moves
            </h2>
            {match.state.log.length === 0 ? (
              <p className="mt-3 border-t border-line pt-3 text-sm text-ink-soft">No moves yet.</p>
            ) : (
              <ol className="mt-3 max-h-64 space-y-1 overflow-auto border-t border-line pt-3 text-sm tabular-nums">
                {match.state.log.map((entry, index) => (
                  <li key={`${entry.kind}-${index}`}>
                    {entry.kind === "move"
                      ? `${index + 1}. ${entry.notation} · ${discLabel(entry.disc)} · ${entry.flipped} flipped`
                      : `${index + 1}. ${discLabel(entry.disc)} passes`}
                  </li>
                ))}
              </ol>
            )}
          </section>

          {!complete && youDisc ? (
            <section aria-labelledby="actions-heading" className={panel === "table" ? "" : "max-lg:hidden"}>
              <h2 id="actions-heading" className="font-display text-2xl font-medium">
                Table
              </h2>
              <div className="mt-3 space-y-2 border-t border-line pt-3">
                {confirmResign ? (
                  <div>
                    <p>Resign this match?</p>
                    <div className="mt-2 flex flex-wrap gap-2">
                      <button
                        type="button"
                        className={buttonClass.solid}
                        onClick={() => {
                          club.resign(match.id);
                          setConfirmResign(false);
                        }}
                      >
                        Resign
                      </button>
                      <button type="button" className={buttonClass.quiet} onClick={() => setConfirmResign(false)}>
                        Keep playing
                      </button>
                    </div>
                  </div>
                ) : (
                  <button type="button" className={buttonClass.text} onClick={() => setConfirmResign(true)}>
                    Resign
                  </button>
                )}
                <div>
                  {match.present[youDisc] ? (
                    <button type="button" className={buttonClass.text} onClick={() => club.setSeatPresence(match.id, club.you.id, false)}>
                      Leave the table
                    </button>
                  ) : (
                    <button type="button" className={buttonClass.text} onClick={() => club.setSeatPresence(match.id, club.you.id, true)}>
                      Return to the table
                    </button>
                  )}
                </div>
              </div>
            </section>
          ) : null}

          <section aria-labelledby="talk-heading" className={panel === "talk" ? "" : "max-lg:hidden"}>
            <h2 id="talk-heading" className="font-display text-2xl font-medium">
              Table talk
            </h2>
            <p className="mt-2 text-sm text-ink-soft">Only the two players. Separate from private messages.</p>
            <div className="mt-3 border-t border-line pt-3">
              {match.talk.length === 0 ? (
                <p className="text-sm text-ink-soft">Nothing has been said at this table.</p>
              ) : (
                <ul className="max-h-48 space-y-3 overflow-auto">
                  {match.talk.map((message) => (
                    <li key={message.id}>
                      <p className="text-sm text-ink-soft">
                        {club.member(message.authorId)?.displayName ?? "Player"} · {formatWhen(message.sentAt, club.now)}
                      </p>
                      <p>{message.body}</p>
                    </li>
                  ))}
                </ul>
              )}
              <form
                className="mt-3 flex flex-col gap-2"
                onSubmit={(event) => {
                  event.preventDefault();
                  const result = club.sendTableMessage(match.id, draft);
                  if (result.ok) setDraft("");
                }}
              >
                <label htmlFor="table-talk" className="text-sm font-semibold">
                  Message
                </label>
                <textarea
                  id="table-talk"
                  value={draft}
                  onChange={(event) => setDraft(event.target.value)}
                  rows={3}
                  maxLength={500}
                  className="w-full border border-line bg-paper-raised px-3 py-2"
                />
                <button type="submit" className={buttonClass.quiet}>
                  Send
                </button>
              </form>
            </div>
          </section>

          <details className="text-sm text-ink-soft">
            <summary className="min-h-11 cursor-pointer font-semibold text-ink">Local table controls</summary>
            <p className="mt-2">
              Both seats are on this device, so you can enter the move for whoever is to play. Clocks here are not the
              server clock. Online matches will not work this way.
            </p>
            {other ? (
              <div className="mt-2">
                <button
                  type="button"
                  className={buttonClass.text}
                  onClick={() =>
                    club.setSeatPresence(
                      match.id,
                      other.id,
                      !(other.id === match.darkId ? match.present.dark : match.present.light),
                    )
                  }
                >
                  {match.present[other.id === match.darkId ? "dark" : "light"]
                    ? `${other.displayName.split(" ")[0]} steps away`
                    : `${other.displayName.split(" ")[0]} returns`}
                </button>
              </div>
            ) : null}
          </details>
        </aside>
      </div>
    </div>
  );
}

function Seat({
  name,
  disc,
  score,
  clock,
  active,
  present,
  align,
}: {
  name: string;
  disc: Disc;
  score: number;
  clock: number | null;
  active: boolean;
  present: boolean;
  align: "left" | "right";
}) {
  return (
      <div className={cx("min-w-0 text-disc-light", align === "right" && "text-right")}>
      <div className={cx("flex items-center gap-2", align === "right" && "flex-row-reverse")}>
        {active ? <span className="size-2 shrink-0 bg-brass" aria-hidden="true" /> : <span className="size-2 shrink-0" />}
        <p className="truncate font-semibold">{name}</p>
      </div>
      <p className="mt-1 text-sm text-disc-light/75">
        {discLabel(disc)} · {score} {score === 1 ? "disc" : "discs"}
        {active ? " · To move" : ""}
        {!present ? " · Left the table" : ""}
      </p>
      {clock !== null ? (
        <p className={cx("mt-1 text-2xl text-disc-light tabular-nums", clock <= 30_000 && active ? "text-brass" : "")}>{formatClock(clock)}</p>
      ) : null}
    </div>
  );
}

function ResultBlock({
  winnerName,
  scoreLabel,
  reason,
  mode,
  bothPresent,
  rematch,
  youId,
  otherId,
  otherName,
  onRequest,
  onWithdraw,
  onAnswer,
  nextMatchId,
}: {
  winnerName: string;
  scoreLabel: string;
  reason: "score" | "resignation" | "timeout";
  mode: "casual" | "rated";
  bothPresent: boolean;
  rematch: {
    requestedBy: string;
    status: "pending" | "accepted" | "declined" | "withdrawn";
    nextMatchId?: string;
  } | null;
  youId: string;
  otherId: string;
  otherName: string;
  onRequest: () => void;
  onWithdraw: () => void;
  onAnswer: (actorId: string, accept: boolean) => void;
  nextMatchId?: string;
}) {
  const reasonLine =
    reason === "resignation" ? "By resignation." : reason === "timeout" ? "By time." : "By the count on the board.";
  const pending = rematch?.status === "pending";
  const youAsked = pending && rematch?.requestedBy === youId;

  return (
    <div className="mt-6 border-t border-ink pt-4">
      <p className="eyebrow">Result</p>
      <p className="mt-2 font-display text-3xl leading-tight font-medium">{winnerName}</p>
      <p className="mt-1 text-ink-soft">
        {scoreLabel}. {reasonLine}
      </p>
      <p className="mt-2 max-w-lg text-sm text-ink-soft">
        {mode === "rated"
          ? "This match was rated. The prototype does not calculate a rating change, so profile numbers stay as sample figures."
          : "Casual. Ratings are unchanged."}
      </p>
      <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:flex-wrap">
        {nextMatchId ? (
          <Link href={`/play/${nextMatchId}`} className={buttonClass.solid}>
            Open the rematch
          </Link>
        ) : youAsked ? (
          <button type="button" className={buttonClass.quiet} onClick={onWithdraw}>
            Withdraw rematch
          </button>
        ) : pending ? (
          <>
            <button type="button" className={buttonClass.solid} onClick={() => onAnswer(youId, true)}>
              Accept rematch
            </button>
            <button type="button" className={buttonClass.quiet} onClick={() => onAnswer(youId, false)}>
              Decline rematch
            </button>
          </>
        ) : (
          <button type="button" className={buttonClass.solid} disabled={!bothPresent} onClick={onRequest}>
            Rematch
          </button>
        )}
        <Link href="/create" className={buttonClass.quiet}>
          New opponent
        </Link>
        <Link href="/" className={buttonClass.quiet}>
          Back to home
        </Link>
      </div>
      {youAsked ? (
        <div className="mt-3">
          <p className="text-sm text-ink-soft">Waiting for {otherName}. A rematch does not start until they accept.</p>
          <div className="mt-2 flex flex-col gap-2 sm:flex-row">
            <button type="button" className={buttonClass.quiet} onClick={() => onAnswer(otherId, true)}>
              Accept for {otherName.split(" ")[0]}
            </button>
            <button type="button" className={buttonClass.quiet} onClick={() => onAnswer(otherId, false)}>
              Decline for {otherName.split(" ")[0]}
            </button>
          </div>
          <p className="mt-2 text-sm text-ink-faint">
            Both seats are on this device. Online, only {otherName.split(" ")[0]} could answer.
          </p>
        </div>
      ) : null}
      {!bothPresent && !pending && !nextMatchId ? (
        <p className="mt-3 text-sm text-ink-soft">Rematch is closed. Someone left the table.</p>
      ) : null}
    </div>
  );
}

function winnerName(
  winner: "dark" | "light" | "draw",
  darkId: string,
  lightId: string,
  member: (id: string) => { displayName: string } | null,
): string {
  if (winner === "draw") return "The board is split.";
  const name = member(winner === "dark" ? darkId : lightId)?.displayName ?? "The winner";
  return `${name} has the board.`;
}
