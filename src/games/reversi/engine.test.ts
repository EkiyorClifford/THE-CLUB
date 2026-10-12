import { describe, expect, it } from "vitest";

import {
  applyMove,
  boardFromDiagram,
  closeGame,
  completedFromBoard,
  discsFlipped,
  initialState,
  legalMoves,
  notationToSquare,
  resolveTurn,
  score,
  squareToNotation,
} from "./engine";

function notations(state: ReturnType<typeof initialState>): string[] {
  return legalMoves(state)
    .map(squareToNotation)
    .sort();
}

describe("reversi opening", () => {
  it("starts with the standard four discs and dark to move", () => {
    const state = initialState();
    expect(score(state.board)).toEqual({ dark: 2, light: 2 });
    expect(state.toMove).toBe("dark");
    expect(notations(state)).toEqual(["c4", "d3", "e6", "f5"]);
  });

  it("plays c4 and flips d4", () => {
    const start = initialState();
    const square = notationToSquare("c4");
    expect(square).not.toBeNull();
    const result = applyMove(start, square!);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.state.board[4]?.[2]).toBe("dark");
    expect(result.state.board[4]?.[3]).toBe("dark");
    expect(result.state.toMove).toBe("light");
    expect(result.state.log[0]).toMatchObject({
      kind: "move",
      notation: "c4",
      flipped: 1,
    });
    expect(start.board[4]?.[3]).toBe("light");
  });
});

describe("illegal moves", () => {
  it("rejects an empty square that flips nothing and keeps the same state", () => {
    const start = initialState();
    const result = applyMove(start, { row: 0, col: 0 });
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.reason).toMatch(/flip/i);
    expect(result.state).toBe(start);
  });

  it("rejects an occupied square", () => {
    const start = initialState();
    const result = applyMove(start, { row: 4, col: 4 });
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.state).toBe(start);
  });

  it("rejects a square off the board", () => {
    const result = applyMove(initialState(), { row: 8, col: 0 });
    expect(result.ok).toBe(false);
  });
});

describe("flips, passes, and completion", () => {
  it("flips in every direction from a surrounded square", () => {
    const board = boardFromDiagram(`
      ........
      ...D....
      ...L....
      .DL.LD..
      ...L....
      ...D....
      ........
      ........
    `);
    const flipped = discsFlipped(board, { row: 3, col: 3 }, "dark");
    expect(flipped).toHaveLength(4);
    const result = applyMove(
      {
        board,
        toMove: "dark",
        lastMove: null,
        status: "playing",
        winner: null,
        endReason: null,
        log: [],
      },
      { row: 3, col: 3 },
    );
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.state.board[3]?.[3]).toBe("dark");
    expect(result.state.board[2]?.[3]).toBe("dark");
    expect(result.state.board[3]?.[2]).toBe("dark");
    expect(result.state.board[3]?.[4]).toBe("dark");
    expect(result.state.board[4]?.[3]).toBe("dark");
  });

  it("passes when the side to move has no legal move", () => {
    const board = boardFromDiagram(`
      LD......
      ........
      ........
      ........
      ........
      ........
      ........
      ........
    `);
    const state = resolveTurn({
      board,
      toMove: "dark",
      lastMove: null,
      status: "playing",
      winner: null,
      endReason: null,
      log: [],
    });
    expect(state.status).toBe("playing");
    expect(state.toMove).toBe("light");
    expect(state.log).toEqual([{ kind: "pass", disc: "dark" }]);
    expect(legalMoves(state).map(squareToNotation)).toEqual(["c8"]);
  });

  it("ends the game when neither side can move", () => {
    const board = boardFromDiagram(`
      DDDDDDDD
      DDDDDDDD
      DDDDDDDD
      DDDDDDDD
      LLLLLLLL
      LLLLLLLL
      LLLLLLLL
      LLLLLLLL
    `);
    const state = resolveTurn({
      board,
      toMove: "dark",
      lastMove: null,
      status: "playing",
      winner: null,
      endReason: null,
      log: [],
    });
    expect(state.status).toBe("complete");
    expect(state.endReason).toBe("score");
    expect(state.winner).toBe("draw");
    expect(score(state.board)).toEqual({ dark: 32, light: 32 });
  });

  it("scores a full board for the majority", () => {
    const board = boardFromDiagram(`
      DDDDDDDD
      DDDDDDDD
      DDDDDDDD
      DDDDDDDD
      DDDDDDDD
      LLLLLLLL
      LLLLLLLL
      LLLLLLLL
    `);
    const state = completedFromBoard(board);
    expect(state.winner).toBe("dark");
    expect(score(state.board)).toEqual({ dark: 40, light: 24 });
  });

  it("refuses further moves after the game is over", () => {
    const done = completedFromBoard(
      boardFromDiagram(`
        DDDDDDDD
        DDDDDDDD
        DDDDDDDD
        DDDDDDDD
        DDDDDDDD
        DDDDDDDD
        DDDDDDDD
        DDDDDDDD
      `),
    );
    const result = applyMove(done, { row: 0, col: 0 });
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.state).toBe(done);
  });
});

describe("resignation and timeout closure", () => {
  it("ends the game for the opponent when a player resigns", () => {
    const closed = closeGame(initialState(), "light", "resignation");
    expect(closed.status).toBe("complete");
    expect(closed.winner).toBe("light");
    expect(closed.endReason).toBe("resignation");
    expect(applyMove(closed, notationToSquare("c4")!).ok).toBe(false);
  });

  it("does not reopen a finished game", () => {
    const once = closeGame(initialState(), "dark", "timeout");
    const twice = closeGame(once, "light", "resignation");
    expect(twice).toBe(once);
  });
});
