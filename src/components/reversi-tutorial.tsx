"use client";

import Link from "next/link";
import { useState } from "react";

import { ReversiBoard } from "@/components/reversi-board";
import {
  advanceTutorial,
  backTutorial,
  playTutorial,
  restartTutorial,
  showTutorial,
  startTutorial,
  TUTORIAL_STEPS,
  tutorialBoard,
  tutorialExpectsMove,
  tutorialStep,
  type TutorialProgress,
} from "@/help/tutorial";
import { buttonClass } from "@/lib/cx";

export function ReversiTutorial() {
  const [progress, setProgress] = useState<TutorialProgress>(() => startTutorial());
  const step = tutorialStep(progress);
  const board = tutorialBoard(progress);
  const last = progress.index === TUTORIAL_STEPS.length - 1;

  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-6 sm:px-6 sm:py-8">
      <p className="text-sm text-ink-soft">
        <Link href="/games/reversi/help" className="underline underline-offset-4">
          Reversi rules
        </Link>
      </p>
      <p className="eyebrow mt-4">Tutorial</p>
      <h1 className="mt-2 font-display text-4xl font-medium tracking-tight">{step.title}</h1>
      <p className="mt-2 text-sm text-ink-soft">
        Step {progress.index + 1} of {TUTORIAL_STEPS.length}. This lesson does not start a match.
      </p>
      <p className="mt-4 max-w-xl">{step.instruction}</p>
      {progress.feedback ? (
        <p className="mt-3 max-w-xl border-t border-ink pt-3" role="status">
          {progress.feedback.tone === "correct" ? "Correct. " : progress.feedback.tone === "incorrect" ? "Not yet. " : ""}
          {progress.feedback.text}
        </p>
      ) : null}
      <div className="mx-auto mt-5 w-full max-w-[40rem]">
        <ReversiBoard state={board} disabled={!tutorialExpectsMove(progress)} onMove={(square) => setProgress(playTutorial(progress, square))} />
      </div>
      <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:flex-wrap">
        <button type="button" className={buttonClass.quiet} onClick={() => setProgress(backTutorial(progress))} disabled={progress.index === 0}>
          Back
        </button>
        {step.kind === "pass" && !progress.solved ? (
          <button type="button" className={buttonClass.solid} onClick={() => setProgress(showTutorial(progress))}>
            Pass
          </button>
        ) : null}
        {step.kind !== "read" && !progress.solved ? (
          <button type="button" className={buttonClass.quiet} onClick={() => setProgress(showTutorial(progress))}>
            Show me
          </button>
        ) : null}
        <button type="button" className={buttonClass.solid} onClick={() => setProgress(advanceTutorial(progress))} disabled={last && progress.solved}>
          Continue
        </button>
        <button type="button" className={buttonClass.text} onClick={() => setProgress(restartTutorial())}>
          Restart tutorial
        </button>
      </div>
      {last && progress.solved ? (
        <p className="mt-6 flex flex-col items-start gap-2 sm:flex-row">
          <Link href="/games/reversi/practice" className={buttonClass.solid}>
            Play vs Computer
          </Link>
          <Link href="/games/reversi/help" className={buttonClass.quiet}>
            Read the rules
          </Link>
        </p>
      ) : null}
    </div>
  );
}
