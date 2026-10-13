import { describe, expect, it } from "vitest";

import { chooseComputerMove, evaluateFor, type Difficulty } from "./ai";
import {
  applyMove,
  boardFromDiagram,
  completedFromBoard,
  initialState,
  legalMoves,
  opposite,
  resolveTurn,
  score,
  squareToNotation,
  type Disc,
  type ReversiState,
  type Square,
} from "./engine";

const DIFFICULTIES: Difficulty[] = ["easy", "medium", "hard"];

function playing(board: ReversiState["board"], toMove: Disc): ReversiState {
  return {
    board,
    toMove,
    lastMove: null,
    status: "playing",
    winner: null,
    endReason: null,
    log: [],
  };
}

function sameSquare(a: Square, b: Square): boolean {
  return a.row === b.row && a.col === b.col;
}

describe("reversi rules used by the computer", () => {
  it("lists the opening moves and flips the bracketed disc", () => {
    const start = initialState();
    expect(legalMoves(start).map(squareToNotation).sort()).toEqual(["c4", "d3", "e6", "f5"]);
    const result = applyMove(start, { row: 4, col: 2 });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.state.board[4]?.[2]).toBe("dark");
    expect(result.state.board[4]?.[3]).toBe("dark");
    expect(score(result.state.board)).toEqual({ dark: 4, light: 1 });
  });

  it("passes a side with no move and ends when neither side can move", () => {
    const result = applyMove(
      playing(
        boardFromDiagram(`
          .LD.....
          ........
          ........
          ........
          ........
          ........
          ........
          ........
        `),
        "dark",
      ),
      { row: 0, col: 0 },
    );
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.state.status).toBe("complete");
    expect(result.state.endReason).toBe("score");
    expect(result.state.winner).toBe("dark");
    expect(score(result.state.board)).toEqual({ dark: 3, light: 0 });
    expect(result.state.log.map((entry) => entry.kind)).toEqual(["move", "pass", "pass"]);
  });

  it("returns the turn when only the opponent has no legal move", () => {
    const result = applyMove(
      playing(
        boardFromDiagram(`
          .LD.....
          ........
          ........
          ........
          ........
          ........
          .L......
          .D......
        `),
        "dark",
      ),
      { row: 0, col: 0 },
    );
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.state.status).toBe("playing");
    expect(result.state.toMove).toBe("dark");
    expect(result.state.log).toEqual([
      expect.objectContaining({ kind: "move", notation: "a8" }),
      { kind: "pass", disc: "light" },
    ]);
    expect(legalMoves(result.state).map(squareToNotation)).toEqual(["b3"]);
  });
});

describe("computer moves", () => {
  it("passes and leaves the opponent to move when only one side is blocked", () => {
    const blocked = playing(
      boardFromDiagram(`
        LD......
        ........
        ........
        ........
        ........
        ........
        ........
        ........
      `),
      "dark",
    );
    for (const difficulty of DIFFICULTIES) {
      expect(chooseComputerMove(blocked, difficulty, () => 0)).toBeNull();
    }
    const passed = resolveTurn(blocked);
    expect(passed.status).toBe("playing");
    expect(passed.toMove).toBe("light");
    expect(passed.log).toEqual([{ kind: "pass", disc: "dark" }]);
    expect(legalMoves(passed).map(squareToNotation)).toEqual(["c8"]);
  });

  it("lets the computer move first when the human takes white", () => {
    let state = initialState();
    const human: Disc = "light";
    const computer = opposite(human);
    expect(state.toMove).toBe(computer);
    const move = chooseComputerMove(state, "easy", () => 0);
    expect(move).not.toBeNull();
    if (!move) return;
    const result = applyMove(state, move);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    state = result.state;
    expect(state.log[0]).toMatchObject({ disc: "dark" });
    expect(state.toMove).toBe(human);
    expect(legalMoves(state).length).toBeGreaterThan(0);
  });

  it("returns null when the side to move has no legal move", () => {
    const blocked = playing(
      boardFromDiagram(`
        DDDDDDDD
        DDDDDDDD
        DDDDDDDD
        DDDDDDDD
        LLLLLLLL
        LLLLLLLL
        LLLLLLLL
        LLLLLLLL
      `),
      "dark",
    );
    for (const difficulty of DIFFICULTIES) {
      expect(chooseComputerMove(blocked, difficulty, () => 0)).toBeNull();
    }
  });

  it.each(DIFFICULTIES)("plays a legal move on %s", (difficulty) => {
    const start = initialState();
    const move = chooseComputerMove(start, difficulty, () => 0.25);
    expect(move).not.toBeNull();
    if (!move) return;
    expect(legalMoves(start).some((square) => sameSquare(square, move))).toBe(true);
    const result = applyMove(start, move);
    expect(result.ok).toBe(true);
  });

  it("easy follows the supplied random choice", () => {
    const start = initialState();
    const moves = legalMoves(start);
    const first = chooseComputerMove(start, "easy", () => 0);
    const last = chooseComputerMove(start, "easy", () => 0.999);
    expect(first).toEqual(moves[0]);
    expect(last).toEqual(moves[moves.length - 1]);
  });

  it("medium prefers a corner to a square beside an empty corner", () => {
    const state = playing(
      boardFromDiagram(`
        .LD.....
        ........
        ........
        ........
        ........
        ........
        ........
        ..LD....
      `),
      "dark",
    );
    const moves = legalMoves(state).map(squareToNotation);
    expect(moves).toEqual(["a8", "b1"]);
    const move = chooseComputerMove(state, "medium");
    expect(move && squareToNotation(move)).toBe("a8");
  });

  it("hard also takes that corner and stays inside the legal set", () => {
    const state = playing(
      boardFromDiagram(`
        .LD.....
        ........
        ........
        ........
        ........
        ........
        ........
        ..LD....
      `),
      "dark",
    );
    const move = chooseComputerMove(state, "hard");
    expect(move && squareToNotation(move)).toBe("a8");
  });

  it("scores a corner disc above the risky square beside an empty corner", () => {
    const corner = playing(
      boardFromDiagram(`
        D.......
        ........
        ........
        ........
        ........
        ........
        ........
        ........
      `),
      "light",
    );
    const risky = playing(
      boardFromDiagram(`
        ........
        .D......
        ........
        ........
        ........
        ........
        ........
        ........
      `),
      "light",
    );
    expect(evaluateFor(corner, "dark")).toBeGreaterThan(evaluateFor(risky, "dark"));
  });

  it("finishes a seeded game with a legal score", () => {
    let state = initialState();
    let guard = 0;
    while (state.status === "playing" && guard < 80) {
      guard += 1;
      const move = chooseComputerMove(state, "easy", () => 0);
      if (!move) break;
      const result = applyMove(state, move);
      expect(result.ok).toBe(true);
      if (!result.ok) return;
      state = result.state;
    }
    expect(state.status).toBe("complete");
    expect(state.endReason).toBe("score");
    const tally = score(state.board);
    expect(tally.dark + tally.light).toBeGreaterThan(4);
    if (tally.dark === tally.light) expect(state.winner).toBe("draw");
    else expect(state.winner).toBe(tally.dark > tally.light ? "dark" : "light");
  });

  it("returns no move from a finished game and does not mutate the input", () => {
    const done = completedFromBoard(
      boardFromDiagram(`
        DDDDDDDD
        DDDDDDDD
        DDDDDDDD
        DDDDDDDD
        DDDDDDDD
        LLLLLLLL
        LLLLLLLL
        LLLLLLLL
      `),
    );
    const before = done.board.map((row) => [...row]);
    for (const difficulty of DIFFICULTIES) {
      expect(chooseComputerMove(done, difficulty, () => 0.5)).toBeNull();
    }
    expect(done.board).toEqual(before);
    expect(done.status).toBe("complete");
  });

  it("finishes a seeded game from either human colour", () => {
    for (const human of ["dark", "light"] as const) {
      const finished = playSeat(human);
      expect(finished.status).toBe("complete");
      const tally = score(finished.board);
      const occupied = tally.dark + tally.light;
      expect(occupied).toBeGreaterThan(4);
      expect(occupied).toBeLessThanOrEqual(64);
      if (tally.dark === tally.light) expect(finished.winner).toBe("draw");
      else expect(finished.winner).toBe(tally.dark > tally.light ? "dark" : "light");
      expect(applyMove(finished, { row: 0, col: 0 }).ok).toBe(false);
    }
  });

  it("keeps a hard search fast enough for a turn and legal", () => {
    const openingStarted = performance.now();
    const openingMove = chooseComputerMove(initialState(), "hard");
    const openingMs = performance.now() - openingStarted;
    expect(openingMove).not.toBeNull();
    expect(applyMove(initialState(), openingMove!).ok).toBe(true);
    expect(openingMs).toBeLessThan(1000);

    let state = initialState();
    for (let ply = 0; ply < 12 && state.status === "playing"; ply += 1) {
      const move = chooseComputerMove(state, "easy", () => 0);
      if (!move) {
        state = resolveTurn(state);
        continue;
      }
      const result = applyMove(state, move);
      expect(result.ok).toBe(true);
      if (!result.ok) return;
      state = result.state;
    }
    if (state.status !== "playing") return;
    const middleStarted = performance.now();
    const middleMove = chooseComputerMove(state, "hard");
    const middleMs = performance.now() - middleStarted;
    if (middleMove) expect(applyMove(state, middleMove).ok).toBe(true);
    else expect(legalMoves(state)).toHaveLength(0);
    expect(middleMs).toBeLessThan(1000);
  });
});

function playSeat(human: Disc): ReversiState {
  let state = initialState();
  const computer = opposite(human);
  for (let guard = 0; guard < 80 && state.status === "playing"; guard += 1) {
    if (state.toMove === computer) {
      const move = chooseComputerMove(state, "easy", () => 0);
      if (!move) {
        state = resolveTurn(state);
        continue;
      }
      const result = applyMove(state, move);
      if (!result.ok) throw new Error("Computer move was illegal.");
      state = result.state;
      continue;
    }
    const humanMove = legalMoves(state)[0];
    if (!humanMove) {
      state = resolveTurn(state);
      continue;
    }
    const result = applyMove(state, humanMove);
    if (!result.ok) throw new Error("Human move was illegal.");
    state = result.state;
  }
  return state;
}
