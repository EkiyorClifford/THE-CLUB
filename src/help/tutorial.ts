import {
  applyMove,
  boardFromDiagram,
  initialState,
  notationToSquare,
  resolveTurn,
  squareToNotation,
  type ReversiState,
  type Square,
} from "@/games/reversi/engine";

export type StepKind = "read" | "move" | "pass";

export type TutorialStep = {
  id: string;
  title: string;
  kind: StepKind;
  instruction: string;
  expect?: string;
};

export type TutorialFeedback = {
  tone: "correct" | "incorrect" | "hint";
  text: string;
};

export type TutorialProgress = {
  index: number;
  solved: boolean;
  acted: boolean;
  feedback: TutorialFeedback | null;
};

export const TUTORIAL_STEPS: readonly TutorialStep[] = [
  {
    id: "opening",
    title: "The opening",
    kind: "read",
    instruction: "Four discs already sit in the centre. Black moves first. Nothing is played on this step.",
  },
  {
    id: "legal",
    title: "A legal move",
    kind: "move",
    expect: "c4",
    instruction: "Play c4. It is empty, and it brackets the white disc on d4 against the black disc on e4.",
  },
  {
    id: "flip",
    title: "The flip",
    kind: "read",
    instruction: "c4 is black, and d4 has turned from white to black. One move flips every bracketed line.",
  },
  {
    id: "pass",
    title: "No legal move",
    kind: "pass",
    instruction: "Black has no line to bracket, so Black passes. White can then play c8.",
  },
  {
    id: "done",
    title: "Ready to play",
    kind: "read",
    instruction: "You can spot a legal move, a flip, and a pass. Practice against the computer is not a rated match.",
  },
];

const STUCK = "Finish this step, or choose Show me. You will not get stuck.";

export function startTutorial(): TutorialProgress {
  return enter(0);
}

export function tutorialStep(progress: TutorialProgress): TutorialStep {
  const step = TUTORIAL_STEPS[progress.index];
  if (!step) throw new Error("Tutorial step is out of range.");
  return step;
}

export function tutorialBoard(progress: TutorialProgress): ReversiState {
  const step = tutorialStep(progress);
  if (step.id === "legal" && progress.acted) return openingMove();
  if (step.id === "flip") return openingMove();
  if (step.id === "pass") return progress.acted ? resolveTurn(passPosition()) : passPosition();
  if (step.id === "done") return resolveTurn(passPosition());
  return initialState();
}

export function advanceTutorial(progress: TutorialProgress): TutorialProgress {
  if (!progress.solved) {
    return { ...progress, feedback: { tone: "hint", text: STUCK } };
  }
  if (progress.index >= TUTORIAL_STEPS.length - 1) return progress;
  return enter(progress.index + 1);
}

export function backTutorial(progress: TutorialProgress): TutorialProgress {
  if (progress.index === 0) return progress;
  return enter(progress.index - 1);
}

export function restartTutorial(): TutorialProgress {
  return startTutorial();
}

export function playTutorial(progress: TutorialProgress, square: Square): TutorialProgress {
  const step = tutorialStep(progress);
  if (step.kind !== "move" || progress.solved) return progress;
  const result = applyMove(tutorialBoard(progress), square);
  if (!result.ok) {
    return { ...progress, feedback: { tone: "incorrect", text: "That square is not a legal move." } };
  }
  const notation = squareToNotation(square);
  if (notation !== step.expect) {
    return {
      ...progress,
      feedback: { tone: "incorrect", text: `${notation} is legal, but this step asks for ${step.expect}.` },
    };
  }
  return {
    ...progress,
    solved: true,
    acted: true,
    feedback: { tone: "correct", text: "c4 flips d4, and it is White to move." },
  };
}

export function showTutorial(progress: TutorialProgress): TutorialProgress {
  const step = tutorialStep(progress);
  switch (step.kind) {
    case "read":
      return progress;
    case "move":
      return {
        ...progress,
        solved: true,
        acted: true,
        feedback: { tone: "correct", text: "Shown: c4 flips the disc on d4." },
      };
    case "pass":
      return {
        ...progress,
        solved: true,
        acted: true,
        feedback: { tone: "correct", text: "Black passes. White can play c8." },
      };
    default: {
      const unreachable: never = step.kind;
      return unreachable;
    }
  }
}

function enter(index: number): TutorialProgress {
  const step = TUTORIAL_STEPS[index];
  if (!step) throw new Error("Tutorial step is out of range.");
  return { index, solved: step.kind === "read", acted: false, feedback: null };
}

function openingMove(): ReversiState {
  const square = notationToSquare("c4");
  if (!square) throw new Error("c4 is not a square.");
  const result = applyMove(initialState(), square);
  if (!result.ok) throw new Error("c4 should be legal from the opening.");
  return result.state;
}

function passPosition(): ReversiState {
  return {
    board: boardFromDiagram(`
      LD......
      ........
      ........
      ........
      ........
      ........
      ........
      ........
    `),
    toMove: "dark",
    lastMove: null,
    status: "playing",
    winner: null,
    endReason: null,
    log: [],
  };
}

export function tutorialExpectsMove(progress: TutorialProgress): boolean {
  const step = tutorialStep(progress);
  return step.kind === "move" && !progress.solved;
}
