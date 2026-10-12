export type HelpSection = {
  id: string;
  title: string;
  kind: "rule" | "tip";
  paragraphs: readonly string[];
};

/**
 * Club copy for Reversi. The statements follow src/games/reversi/engine.ts:
 * dark moves first, a move must flip, passes are forced, empty squares are not awarded.
 */
export const REVERSI_HELP: readonly HelpSection[] = [
  {
    id: "objective",
    title: "Objective",
    kind: "rule",
    paragraphs: [
      "Finish with more discs of your colour than your opponent. The game counts only discs on the board.",
      "Empty squares are not awarded to either player. A tie on the disc count is a draw.",
    ],
  },
  {
    id: "board",
    title: "Board and first move",
    kind: "rule",
    paragraphs: [
      "The board is 8 by 8. Black is the dark disc. White is the light disc.",
      "Four discs start in the centre: black on d5 and e4, white on d4 and e5. Black moves first.",
    ],
  },
  {
    id: "legal",
    title: "Legal moves",
    kind: "rule",
    paragraphs: [
      "A move lands on an empty square and must flip at least one opponent disc. From the opening, the legal moves are c4, d3, e6, and f5. a1 is not legal, because it flips nothing.",
      "The flipped discs must form a straight line, horizontally, vertically, or diagonally, with your own disc at the far end.",
    ],
  },
  {
    id: "flip",
    title: "Flips",
    kind: "rule",
    paragraphs: [
      "Every bracketed opponent disc in that line turns to your colour. If several directions are bracketed, they all flip on the same move.",
      "Playing c4 from the opening flips the white disc on d4. A later move can flip a longer line, or more than one line at once.",
    ],
  },
  {
    id: "pass",
    title: "No legal move",
    kind: "rule",
    paragraphs: [
      "If you have no legal move, you pass. You cannot place a disc that flips nothing.",
      "Your opponent then plays, if they have a move. If they do not, the game ends.",
    ],
  },
  {
    id: "end",
    title: "How the game ends",
    kind: "rule",
    paragraphs: [
      "The game ends when neither player has a legal move. The board may still contain empty squares.",
      "The side with more discs wins. An equal count is a draw. Resigning or running out of time ends a club match earlier. Those endings are not part of the disc-counting rule.",
    ],
  },
  {
    id: "tips",
    title: "Beginner tips",
    kind: "tip",
    paragraphs: [
      "These notes are not rules. Corners are usually valuable. A square touching an empty corner is often a gift to your opponent.",
      "Practice against the computer is unrated. It does not change a club rating and it does not open a challenge.",
    ],
  },
];

export function helpSection(id: string): HelpSection {
  const section = REVERSI_HELP.find((item) => item.id === id);
  if (!section) throw new Error(`Missing Reversi help section ${id}.`);
  return section;
}
