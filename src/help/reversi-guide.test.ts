import { describe, expect, it } from "vitest";

import { applyMove, initialState, legalMoves, notationToSquare, score, squareToNotation } from "@/games/reversi/engine";

import { helpFor } from "./availability";
import { helpSection, REVERSI_HELP } from "./reversi-guide";

describe("reversi help", () => {
  it("lists the opening moves the engine allows, and rejects a1", () => {
    const text = helpSection("legal").paragraphs.join(" ");
    const openings = legalMoves(initialState()).map(squareToNotation);
    for (const move of openings) expect(text).toContain(move);
    expect(text).toContain("a1");
    const illegal = applyMove(initialState(), notationToSquare("a1")!);
    expect(illegal.ok).toBe(false);
  });

  it("agrees that black moves first and c4 flips one disc", () => {
    expect(initialState().toMove).toBe("dark");
    expect(helpSection("board").paragraphs.join(" ")).toMatch(/Black moves first/);
    const square = notationToSquare("c4");
    const result = applyMove(initialState(), square!);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.state.log[0]).toMatchObject({ notation: "c4", flipped: 1 });
    expect(helpSection("flip").paragraphs.join(" ")).toMatch(/c4/);
  });

  it("does not award empty squares", () => {
    expect(helpSection("objective").paragraphs.join(" ")).toMatch(/Empty squares are not awarded/);
    expect(helpSection("end").paragraphs.join(" ")).toMatch(/empty squares/);
    expect(score(initialState().board)).toEqual({ dark: 2, light: 2 });
  });

  it("keeps beginner tips out of the rules", () => {
    const tips = REVERSI_HELP.filter((section) => section.kind === "tip");
    const rules = REVERSI_HELP.filter((section) => section.kind === "rule");
    expect(tips.map((section) => section.id)).toEqual(["tips"]);
    expect(rules.every((section) => !section.paragraphs.join(" ").includes("Corners are usually"))).toBe(true);
  });

  it("offers Reversi help and refuses invented chess rules", () => {
    const reversi = helpFor("reversi");
    const chess = helpFor("chess");
    const scrabble = helpFor("scrabble");
    expect(reversi?.available).toBe(true);
    expect(chess?.available).toBe(false);
    if (!chess || chess.available) return;
    expect(chess.reason).toMatch(/No board is offered yet/);
    expect(scrabble?.available).toBe(false);
    expect(helpFor("bridge")).toBeNull();
  });
});
