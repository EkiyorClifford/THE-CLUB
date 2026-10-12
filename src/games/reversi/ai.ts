import {
  applyMove,
  discsFlipped,
  legalMoves,
  opposite,
  score,
  type Board,
  type Disc,
  type ReversiState,
  type Square,
} from "./engine";

export type Difficulty = "easy" | "medium" | "hard";

const WEIGHTS: readonly (readonly number[])[] = [
  [120, -20, 20, 5, 5, 20, -20, 120],
  [-20, -40, -5, -5, -5, -5, -40, -20],
  [20, -5, 15, 3, 3, 15, -5, 20],
  [5, -5, 3, 3, 3, 3, -5, 5],
  [5, -5, 3, 3, 3, 3, -5, 5],
  [20, -5, 15, 3, 3, 15, -5, 20],
  [-20, -40, -5, -5, -5, -5, -40, -20],
  [120, -20, 20, 5, 5, 20, -20, 120],
];

/** Squares next to a corner. The diagonal (X-square) is riskier than the orthogonal neighbours. */
const CORNER_RISKS: readonly {
  corner: Square;
  squares: readonly { square: Square; penalty: number }[];
}[] = [
  {
    corner: { row: 0, col: 0 },
    squares: [
      { square: { row: 0, col: 1 }, penalty: 18 },
      { square: { row: 1, col: 0 }, penalty: 18 },
      { square: { row: 1, col: 1 }, penalty: 36 },
    ],
  },
  {
    corner: { row: 0, col: 7 },
    squares: [
      { square: { row: 0, col: 6 }, penalty: 18 },
      { square: { row: 1, col: 7 }, penalty: 18 },
      { square: { row: 1, col: 6 }, penalty: 36 },
    ],
  },
  {
    corner: { row: 7, col: 0 },
    squares: [
      { square: { row: 7, col: 1 }, penalty: 18 },
      { square: { row: 6, col: 0 }, penalty: 18 },
      { square: { row: 6, col: 1 }, penalty: 36 },
    ],
  },
  {
    corner: { row: 7, col: 7 },
    squares: [
      { square: { row: 7, col: 6 }, penalty: 18 },
      { square: { row: 6, col: 7 }, penalty: 18 },
      { square: { row: 6, col: 6 }, penalty: 36 },
    ],
  },
];

const HARD_NODE_BUDGET = 30_000;

/**
 * Pick a legal move for the side to move, or null when that side must pass.
 * Easy is random. Medium is one-ply positional. Hard is minimax with alpha-beta.
 */
export function chooseComputerMove(
  state: ReversiState,
  difficulty: Difficulty,
  random: () => number = Math.random,
): Square | null {
  switch (difficulty) {
    case "easy":
      return chooseEasy(state, random);
    case "medium":
      return chooseMedium(state);
    case "hard":
      return chooseHard(state);
    default: {
      const unreachable: never = difficulty;
      return unreachable;
    }
  }
}

export function evaluateFor(state: ReversiState, disc: Disc): number {
  const tally = score(state.board);
  const diff = disc === "dark" ? tally.dark - tally.light : tally.light - tally.dark;
  if (state.status === "complete") {
    if (state.winner === disc) return 100_000 + diff;
    if (state.winner === "draw" || state.winner === null) return diff;
    return -100_000 + diff;
  }

  let positional = 0;
  for (let row = 0; row < WEIGHTS.length; row += 1) {
    const line = state.board[row];
    const weights = WEIGHTS[row];
    if (!line || !weights) continue;
    for (let col = 0; col < weights.length; col += 1) {
      const weight = weights[col] ?? 0;
      const cell = line[col];
      if (cell === disc) positional += weight;
      else if (cell) positional -= weight;
    }
  }

  const ownMoves = countMoves(state.board, disc);
  const opponentMoves = countMoves(state.board, opposite(disc));
  return positional + riskyAdjustment(state.board, disc) + (ownMoves - opponentMoves) * 8 + diff;
}

function chooseEasy(state: ReversiState, random: () => number): Square | null {
  const moves = legalMoves(state);
  if (moves.length === 0) return null;
  const raw = random();
  const scaled = Number.isFinite(raw) ? raw : 0;
  const index = Math.min(moves.length - 1, Math.max(0, Math.floor(scaled * moves.length)));
  return moves[index] ?? null;
}

function chooseMedium(state: ReversiState): Square | null {
  const moves = legalMoves(state);
  if (moves.length === 0) return null;
  const disc = state.toMove;
  let best: Square | null = null;
  let bestScore = Number.NEGATIVE_INFINITY;
  for (const move of moves) {
    const result = applyMove(state, move);
    if (!result.ok) continue;
    const value = evaluateFor(result.state, disc);
    if (value > bestScore) {
      bestScore = value;
      best = move;
    }
  }
  return best;
}

function chooseHard(state: ReversiState): Square | null {
  const moves = legalMoves(state);
  if (moves.length === 0) return null;
  if (moves.length === 1) return moves[0] ?? null;

  const computer = state.toMove;
  const tally = score(state.board);
  const empties = 64 - tally.dark - tally.light;
  const maxDepth = empties <= 8 ? empties : 4;
  const ordered = orderMoves(state, moves);
  let bestMove = ordered[0] ?? null;
  if (!bestMove) return null;

  let nodes = 0;
  const exceeded = () => {
    nodes += 1;
    return nodes > HARD_NODE_BUDGET;
  };

  for (let depth = 1; depth <= maxDepth; depth += 1) {
    let depthBest = bestMove;
    let depthScore = Number.NEGATIVE_INFINITY;
    let alpha = Number.NEGATIVE_INFINITY;
    let completed = true;
    for (const move of ordered) {
      const result = applyMove(state, move);
      if (!result.ok) continue;
      const value = minimax(result.state, depth - 1, alpha, Number.POSITIVE_INFINITY, computer, exceeded);
      if (value === null) {
        completed = false;
        break;
      }
      if (value > depthScore) {
        depthScore = value;
        depthBest = move;
      }
      alpha = Math.max(alpha, depthScore);
    }
    if (!completed) break;
    bestMove = depthBest;
  }

  return bestMove;
}

function minimax(
  state: ReversiState,
  depth: number,
  alpha: number,
  beta: number,
  computer: Disc,
  exceeded: () => boolean,
): number | null {
  if (exceeded()) return null;
  if (state.status === "complete" || depth === 0) return evaluateFor(state, computer);

  const moves = orderMoves(state, legalMoves(state));
  if (moves.length === 0) return evaluateFor(state, computer);

  const maximizing = state.toMove === computer;
  let best = maximizing ? Number.NEGATIVE_INFINITY : Number.POSITIVE_INFINITY;
  let nextAlpha = alpha;
  let nextBeta = beta;

  for (const move of moves) {
    const result = applyMove(state, move);
    if (!result.ok) continue;
    const value = minimax(result.state, depth - 1, nextAlpha, nextBeta, computer, exceeded);
    if (value === null) return null;
    if (maximizing) {
      best = Math.max(best, value);
      nextAlpha = Math.max(nextAlpha, best);
    } else {
      best = Math.min(best, value);
      nextBeta = Math.min(nextBeta, best);
    }
    if (nextBeta <= nextAlpha) break;
  }

  return best;
}

function orderMoves(state: ReversiState, moves: readonly Square[]): Square[] {
  return [...moves].sort((a, b) => {
    const cornerDelta = Number(isCorner(b)) - Number(isCorner(a));
    if (cornerDelta !== 0) return cornerDelta;
    return discsFlipped(state.board, b, state.toMove).length - discsFlipped(state.board, a, state.toMove).length;
  });
}

function isCorner(square: Square): boolean {
  return (square.row === 0 || square.row === 7) && (square.col === 0 || square.col === 7);
}

function countMoves(board: Board, disc: Disc): number {
  return legalMoves({
    board,
    toMove: disc,
    lastMove: null,
    status: "playing",
    winner: null,
    endReason: null,
    log: [],
  }).length;
}

function riskyAdjustment(board: Board, disc: Disc): number {
  let adjustment = 0;
  for (const group of CORNER_RISKS) {
    const corner = board[group.corner.row]?.[group.corner.col];
    if (corner) continue;
    for (const risk of group.squares) {
      const cell = board[risk.square.row]?.[risk.square.col];
      if (cell === disc) adjustment -= risk.penalty;
      else if (cell) adjustment += risk.penalty;
    }
  }
  return adjustment;
}
