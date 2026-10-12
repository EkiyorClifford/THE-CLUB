import { describe, expect, it } from "vitest";

import { legalMoves, notationToSquare, squareToNotation } from "@/games/reversi/engine";

import {
  advanceTutorial,
  backTutorial,
  playTutorial,
  restartTutorial,
  showTutorial,
  startTutorial,
  tutorialBoard,
  tutorialStep,
} from "./tutorial";

describe("reversi tutorial", () => {
  it("starts on the opening and moves forward and back", () => {
    const start = startTutorial();
    expect(tutorialStep(start).id).toBe("opening");
    expect(start.solved).toBe(true);
    const next = advanceTutorial(start);
    expect(tutorialStep(next).id).toBe("legal");
    expect(next.solved).toBe(false);
    expect(tutorialStep(backTutorial(next)).id).toBe("opening");
  });

  it("rejects a different legal square and accepts c4", () => {
    const step = advanceTutorial(startTutorial());
    const wrong = playTutorial(step, notationToSquare("d3")!);
    expect(wrong.solved).toBe(false);
    expect(wrong.feedback?.text).toMatch(/d3 is legal/);
    expect(tutorialBoard(wrong).log).toHaveLength(0);
    const right = playTutorial(step, notationToSquare("c4")!);
    expect(right.solved).toBe(true);
    expect(right.feedback?.tone).toBe("correct");
    expect(tutorialBoard(right).board[4]?.[3]).toBe("dark");
  });

  it("does not advance an unfinished step, and Show me unlocks it", () => {
    const step = advanceTutorial(startTutorial());
    const held = advanceTutorial(step);
    expect(held.index).toBe(step.index);
    expect(held.feedback?.text).toMatch(/Show me/);
    const shown = showTutorial(step);
    expect(shown.solved).toBe(true);
    expect(tutorialStep(advanceTutorial(shown)).id).toBe("flip");
  });

  it("passes for the side with no move and can restart", () => {
    let progress = startTutorial();
    while (tutorialStep(progress).id !== "pass") {
      if (!progress.solved) progress = showTutorial(progress);
      progress = advanceTutorial(progress);
    }
    expect(legalMoves(tutorialBoard(progress))).toHaveLength(0);
    const passed = showTutorial(progress);
    expect(passed.solved).toBe(true);
    expect(legalMoves(tutorialBoard(passed)).map(squareToNotation)).toEqual(["c8"]);
    expect(tutorialStep(restartTutorial()).id).toBe("opening");
  });
});
