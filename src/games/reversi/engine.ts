/**
 * Reversi (Othello) rules, independent of any interface.
 *
 * Coordinates: row 0 is the top of the board (rank 8), column 0 is file a.
 * Dark moves first from the standard opening.
 * A move is legal only when it flips at least one disc.
 * A player with no legal move passes. The game ends when neither side can move.
 * The winner is whoever has more discs. Empty squares are not awarded.
 */

export type Disc = "dark" | "light";
export type Cell = Disc | null;
export type Board = Cell[][];

export type Square = {
  row: number;
  col: number;
};

export type LogEntry =
  | {
      kind: "move";
      disc: Disc;
      square: Square;
      notation: string;
      flipped: number;
    }
  | { kind: "pass"; disc: Disc };

export type EndReason = "score" | "resignation" | "timeout";

export type ReversiState = {
  board: Board;
  toMove: Disc;
  lastMove: Square | null;
  status: "playing" | "complete";
  winner: Disc | "draw" | null;
  endReason: EndReason | null;
  log: LogEntry[];
};

export type MoveResult =
  | { ok: true; state: ReversiState }
  | { ok: false; reason: string; state: ReversiState };

const DIRECTIONS: ReadonlyArray<readonly [number, number]> = [
  [-1, -1],
  [-1, 0],
  [-1, 1],
  [0, -1],
  [0, 1],
  [1, -1],
  [1, 0],
  [1, 1],
];

export const BOARD_SIZE = 8;

export function opposite(disc: Disc): Disc {
  return disc === "dark" ? "light" : "dark";
}

export function squareToNotation(square: Square): string {
  const file = "abcdefgh"[square.col] ?? "?";
  const rank = BOARD_SIZE - square.row;
  return `${file}${rank}`;
}

export function notationToSquare(notation: string): Square | null {
  const match = /^([a-h])([1-8])$/.exec(notation);
  if (!match) return null;
  const file = match[1];
  const rank = match[2];
  if (!file || !rank) return null;
  return {
    col: file.charCodeAt(0) - "a".charCodeAt(0),
    row: BOARD_SIZE - Number(rank),
  };
}

export function emptyBoard(): Board {
  return Array.from({ length: BOARD_SIZE }, () =>
    Array.from({ length: BOARD_SIZE }, () => null),
  );
}

export function initialState(): ReversiState {
  const board = emptyBoard();
  const row = (index: number) => {
    const line = board[index];
    if (!line) throw new Error("Reversi board was not 8 rows.");
    return line;
  };
  // Standard opening: dark on d5 and e4, light on e5 and d4.
  row(3)[3] = "dark";
  row(3)[4] = "light";
  row(4)[3] = "light";
  row(4)[4] = "dark";
  return {
    board,
    toMove: "dark",
    lastMove: null,
    status: "playing",
    winner: null,
    endReason: null,
    log: [],
  };
}

export function score(board: Board): { dark: number; light: number } {
  let dark = 0;
  let light = 0;
  for (const row of board) {
    for (const cell of row) {
      if (cell === "dark") dark += 1;
      if (cell === "light") light += 1;
    }
  }
  return { dark, light };
}

function inside(row: number, col: number): boolean {
  return row >= 0 && row < BOARD_SIZE && col >= 0 && col < BOARD_SIZE;
}

function cellAt(board: Board, row: number, col: number): Cell | undefined {
  if (!inside(row, col)) return undefined;
  return board[row]?.[col] ?? null;
}

export function discsFlipped(board: Board, square: Square, disc: Disc): Square[] {
  if (cellAt(board, square.row, square.col) !== null) return [];
  const opponent = opposite(disc);
  const flipped: Square[] = [];

  for (const [dRow, dCol] of DIRECTIONS) {
    const line: Square[] = [];
    let row = square.row + dRow;
    let col = square.col + dCol;
    while (cellAt(board, row, col) === opponent) {
      line.push({ row, col });
      row += dRow;
      col += dCol;
    }
    if (line.length > 0 && cellAt(board, row, col) === disc) {
      flipped.push(...line);
    }
  }

  return flipped;
}

export function legalMoves(state: ReversiState): Square[] {
  if (state.status !== "playing") return [];
  const moves: Square[] = [];
  for (let row = 0; row < BOARD_SIZE; row += 1) {
    for (let col = 0; col < BOARD_SIZE; col += 1) {
      if (discsFlipped(state.board, { row, col }, state.toMove).length > 0) {
        moves.push({ row, col });
      }
    }
  }
  return moves;
}

function cloneBoard(board: Board): Board {
  return board.map((row) => [...row]);
}

function winnerFromScore(board: Board): Disc | "draw" {
  const tally = score(board);
  if (tally.dark === tally.light) return "draw";
  return tally.dark > tally.light ? "dark" : "light";
}

function completeByScore(state: ReversiState): ReversiState {
  return {
    ...state,
    status: "complete",
    winner: winnerFromScore(state.board),
    endReason: "score",
  };
}

/** If the side to move cannot play, pass or end the game. Never loops. */
export function resolveTurn(state: ReversiState): ReversiState {
  if (state.status !== "playing") return state;
  if (legalMoves(state).length > 0) return state;

  const passed: ReversiState = {
    ...state,
    toMove: opposite(state.toMove),
    log: [...state.log, { kind: "pass", disc: state.toMove }],
  };
  if (legalMoves(passed).length > 0) return passed;

  return completeByScore({
    ...passed,
    log: [...passed.log, { kind: "pass", disc: passed.toMove }],
  });
}

export function applyMove(state: ReversiState, square: Square): MoveResult {
  if (state.status !== "playing") {
    return { ok: false, reason: "The match is over.", state };
  }
  if (!inside(square.row, square.col)) {
    return { ok: false, reason: "That square is not on the board.", state };
  }
  if (cellAt(state.board, square.row, square.col) !== null) {
    return { ok: false, reason: "That square is already occupied.", state };
  }

  const flipped = discsFlipped(state.board, square, state.toMove);
  if (flipped.length === 0) {
    return { ok: false, reason: "That move does not flip a disc.", state };
  }

  const board = cloneBoard(state.board);
  const placedRow = board[square.row];
  if (!placedRow) {
    return { ok: false, reason: "That square is not on the board.", state };
  }
  placedRow[square.col] = state.toMove;
  for (const target of flipped) {
    const row = board[target.row];
    if (!row) continue;
    row[target.col] = state.toMove;
  }

  const moved: ReversiState = {
    board,
    toMove: opposite(state.toMove),
    lastMove: square,
    status: "playing",
    winner: null,
    endReason: null,
    log: [
      ...state.log,
      {
        kind: "move",
        disc: state.toMove,
        square,
        notation: squareToNotation(square),
        flipped: flipped.length,
      },
    ],
  };

  return { ok: true, state: resolveTurn(moved) };
}

export function closeGame(
  state: ReversiState,
  winner: Disc | "draw",
  reason: "resignation" | "timeout",
): ReversiState {
  if (state.status === "complete") return state;
  return {
    ...state,
    status: "complete",
    winner,
    endReason: reason,
  };
}

export function completedFromBoard(board: Board): ReversiState {
  return {
    board: cloneBoard(board),
    toMove: "dark",
    lastMove: null,
    status: "complete",
    winner: winnerFromScore(board),
    endReason: "score",
    log: [],
  };
}

/** Parse an 8-line diagram. D = dark, L = light, . = empty. */
export function boardFromDiagram(diagram: string): Board {
  const rows = diagram
    .trim()
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);
  if (rows.length !== BOARD_SIZE) {
    throw new Error("A Reversi diagram needs 8 rows.");
  }
  return rows.map((line) => {
    if (line.length !== BOARD_SIZE) {
      throw new Error("A Reversi diagram row needs 8 cells.");
    }
    return [...line].map((symbol) => {
      if (symbol === "D") return "dark";
      if (symbol === "L") return "light";
      if (symbol === ".") return null;
      throw new Error(`Unknown board symbol "${symbol}".`);
    });
  });
}
