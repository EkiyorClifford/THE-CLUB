"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import { discLabel } from "@/domain/format";
import { chooseComputerMove, type Difficulty } from "@/games/reversi/ai";
import { applyMove, initialState, opposite, resolveTurn, score, type Disc, type ReversiState, type Square } from "@/games/reversi/engine";
import { buttonClass, cx } from "@/lib/cx";

import { ReversiBoard } from "./reversi-board";

const DIFFICULTIES: { id: Difficulty; label: string; detail: string }[] = [
  { id: "easy", label: "Easy", detail: "A random legal move." },
  { id: "medium", label: "Medium", detail: "Corners, mobility, and risky squares." },
  { id: "hard", label: "Hard", detail: "A short lookahead search." },
];

export function SoloReversi() {
  const [difficulty, setDifficulty] = useState<Difficulty>("easy");
  const [human, setHuman] = useState<Disc>("dark");
  const [started, setStarted] = useState(false);
  const [state, setState] = useState<ReversiState>(() => initialState());

  const computer = opposite(human);
  const inProgress = started && state.status === "playing";
  const complete = started && state.status === "complete";
  const tally = score(state.board);
  const thinking = inProgress && state.toMove === computer;
  const humanTurn = inProgress && state.toMove === human;

  useEffect(() => {
    if (!thinking) return;

    let active = true;
    const handle = window.setTimeout(() => {
      if (!active) return;
      const move = chooseComputerMove(state, difficulty);
      if (!active) return;
      setState((current) => {
        if (current !== state || current.status !== "playing" || current.toMove !== computer) return current;
        if (!move) return resolveTurn(current);
        const result = applyMove(current, move);
        return result.ok ? result.state : current;
      });
    }, 280);

    return () => {
      active = false;
      window.clearTimeout(handle);
    };
  }, [computer, difficulty, state, thinking]);

  function begin() {
    setState(initialState());
    setStarted(true);
  }

  function playHuman(square: Square) {
    setState((current) => {
      if (!started || current.status !== "playing" || current.toMove !== human) return current;
      const result = applyMove(current, square);
      return result.ok ? result.state : current;
    });
  }

  const last = state.log[state.log.length - 1];

  return (
    <div className="bg-felt-deep text-disc-light">
      <div className="mx-auto grid w-full max-w-6xl items-start lg:grid-cols-[minmax(0,1fr)_22rem]">
        <div className="min-w-0 px-4 py-5 sm:px-6">
          <p className="text-sm text-disc-light/80">
            <Link href="/games/reversi" className="underline underline-offset-4">
              Reversi
            </Link>
            <span aria-hidden="true"> / </span>
            Practice
            <span aria-hidden="true"> / </span>
            <Link href="/games/reversi/help" className="underline underline-offset-4">
              Help & Rules
            </Link>
          </p>
          <h1 className="mt-2 font-display text-4xl font-medium tracking-tight">Play vs Computer</h1>
          <p className="mt-2 max-w-xl text-disc-light/80">
            Practice. This table is not a challenge and it is not rated.
          </p>

          {complete && state.winner ? (
            <div className="mt-6 border-t border-disc-light/30 pt-4">
              <p className="text-sm font-semibold tracking-[0.16em] text-disc-light/70 uppercase">Result</p>
              <p className="mt-2 font-display text-3xl font-medium">{resultHeadline(state.winner, human)}</p>
              <p className="mt-1">
                Black {tally.dark} · White {tally.light}
              </p>
              <p className="mt-2 text-sm text-disc-light/75">Practice. Your club rating is unchanged.</p>
            </div>
          ) : null}

          <div className="mt-6 grid grid-cols-2 gap-3 border-y border-disc-light/25 py-4" aria-live="polite">
            <Seat
              name={human === "dark" ? "You" : "Computer"}
              disc="dark"
              discs={tally.dark}
              active={inProgress && state.toMove === "dark"}
              thinking={thinking && computer === "dark"}
            />
            <Seat
              name={human === "light" ? "You" : "Computer"}
              disc="light"
              discs={tally.light}
              active={inProgress && state.toMove === "light"}
              thinking={thinking && computer === "light"}
              align="right"
            />
          </div>

          <p className="mt-4 text-sm text-disc-light/80" role="status">
            {statusLine(started, state, human, thinking)}
          </p>
          {last?.kind === "pass" ? (
            <p className="mt-1 text-sm text-disc-light/70">{discLabel(last.disc)} has no legal move and passes.</p>
          ) : null}

          <div className="mx-auto mt-4 w-full max-w-[40rem]">
            <ReversiBoard state={state} disabled={!humanTurn} onMove={playHuman} />
          </div>
          <p className="mt-2 text-sm text-disc-light/70">Arrow keys move between squares. Enter plays a legal move.</p>
        </div>

        <aside className="space-y-8 bg-paper px-4 py-5 text-ink sm:px-6 lg:py-8">
          <section aria-labelledby="setup-heading">
            <h2 id="setup-heading" className="font-display text-2xl font-medium">
              Practice setup
            </h2>
            <form
              className="mt-3 space-y-4 border-t border-line pt-3"
              onSubmit={(event) => {
                event.preventDefault();
                begin();
              }}
            >
              <fieldset disabled={inProgress}>
                <legend className="text-sm font-semibold">Difficulty</legend>
                <div className="mt-2 grid gap-2">
                  {DIFFICULTIES.map((option) => (
                    <label
                      key={option.id}
                      className={cx(
                        "flex min-h-11 cursor-pointer items-start gap-3 border px-3 py-2",
                        difficulty === option.id ? "border-ink bg-paper-sunk" : "border-line bg-paper-raised",
                        inProgress && "cursor-not-allowed",
                      )}
                    >
                      <input
                        type="radio"
                        name="difficulty"
                        className="mt-1"
                        checked={difficulty === option.id}
                        onChange={() => setDifficulty(option.id)}
                      />
                      <span>
                        <span className="block font-semibold">{option.label}</span>
                        <span className="block text-sm text-ink-soft">{option.detail}</span>
                      </span>
                    </label>
                  ))}
                </div>
              </fieldset>

              <fieldset disabled={inProgress}>
                <legend className="text-sm font-semibold">Your colour</legend>
                <p className="mt-1 text-sm text-ink-soft">Black moves first.</p>
                <div className="mt-2 grid grid-cols-2 gap-2">
                  {(
                    [
                      ["dark", "Black"],
                      ["light", "White"],
                    ] as const
                  ).map(([id, label]) => (
                    <label
                      key={id}
                      className={cx(
                        "flex min-h-11 cursor-pointer items-center gap-2 border px-3",
                        human === id ? "border-ink bg-paper-sunk" : "border-line bg-paper-raised",
                        inProgress && "cursor-not-allowed",
                      )}
                    >
                      <input type="radio" name="colour" checked={human === id} onChange={() => setHuman(id)} />
                      <span className="font-semibold">{label}</span>
                    </label>
                  ))}
                </div>
              </fieldset>

              {started ? (
                <div className="flex flex-wrap gap-2">
                  <button type="button" className={buttonClass.solid} onClick={begin}>
                    {complete ? "New match" : "Restart"}
                  </button>
                  {complete ? (
                    <button
                      type="button"
                      className={buttonClass.quiet}
                      onClick={() => {
                        setStarted(false);
                        setState(initialState());
                      }}
                    >
                      Change setup
                    </button>
                  ) : null}
                </div>
              ) : (
                <button type="submit" className={buttonClass.solid}>
                  Start practice
                </button>
              )}
              <p>
                <Link href="/games/reversi" className={buttonClass.text}>
                  Exit
                </Link>
              </p>
            </form>
          </section>

          <section aria-labelledby="solo-moves-heading">
            <h2 id="solo-moves-heading" className="font-display text-2xl font-medium">
              Moves
            </h2>
            {state.log.length === 0 ? (
              <p className="mt-3 border-t border-line pt-3 text-sm text-ink-soft">No moves yet.</p>
            ) : (
              <ol className="mt-3 max-h-64 space-y-1 overflow-auto border-t border-line pt-3 text-sm tabular-nums">
                {state.log.map((entry, index) => (
                  <li key={`${entry.kind}-${index}`}>
                    {entry.kind === "move"
                      ? `${index + 1}. ${entry.notation} · ${discLabel(entry.disc)} · ${entry.flipped} flipped`
                      : `${index + 1}. ${discLabel(entry.disc)} passes`}
                  </li>
                ))}
              </ol>
            )}
          </section>
        </aside>
      </div>
    </div>
  );
}

function Seat({
  name,
  disc,
  discs,
  active,
  thinking,
  align = "left",
}: {
  name: string;
  disc: Disc;
  discs: number;
  active: boolean;
  thinking: boolean;
  align?: "left" | "right";
}) {
  return (
    <div className={cx("min-w-0", align === "right" && "text-right")}>
      <div className={cx("flex items-center gap-2", align === "right" && "flex-row-reverse")}>
        {active ? <span className="size-2 shrink-0 bg-brass" aria-hidden="true" /> : <span className="size-2 shrink-0" />}
        <p className="truncate font-semibold">{name}</p>
      </div>
      <p className="mt-1 text-sm text-disc-light/75">
        {disc === "dark" ? "Black" : "White"} · {discs} {discs === 1 ? "disc" : "discs"}
        {thinking ? " · Thinking" : active ? " · To move" : ""}
      </p>
    </div>
  );
}

function statusLine(started: boolean, state: ReversiState, human: Disc, thinking: boolean): string {
  if (!started) return "Choose a difficulty and a colour, then start. Easy is selected.";
  if (state.status === "complete") return "The game is over.";
  if (thinking) return "Computer is thinking.";
  if (state.toMove === human) return "Your turn.";
  return "Computer to move.";
}

function resultHeadline(winner: Disc | "draw", human: Disc): string {
  if (winner === "draw") return "The board is split.";
  if (winner === human) return "You have the board.";
  return "The computer has the board.";
}
