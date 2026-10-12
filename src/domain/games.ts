import type { GameId } from "./types";

export type GameStatus = "playable" | "soon" | "planned";

export type CatalogGame = {
  id: GameId;
  name: string;
  summary: string;
  players: string;
  /** Honest note when the player count is not a table you can open. */
  playersNote: string;
  status: GameStatus;
  statusLabel: string;
  modes: readonly string[];
};

export const GAME_CATALOG: readonly CatalogGame[] = [
  {
    id: "reversi",
    name: "Reversi",
    summary: "Trap a line, flip the discs, and take the board.",
    players: "2 players",
    playersNote: "The only table open in this prototype.",
    status: "playable",
    statusLabel: "Playable now",
    modes: ["Casual", "Rated"],
  },
  {
    id: "chess",
    name: "Chess",
    summary: "A full board, once a rules library sits in the club.",
    players: "2 players",
    playersNote: "Coming soon. No board is offered yet.",
    status: "soon",
    statusLabel: "Coming soon",
    modes: [],
  },
  {
    id: "scrabble",
    name: "Scrabble",
    summary: "Words, a tile bag, and a dictionary, when the table is built.",
    players: "2–4 players, planned",
    playersNote: "Planned capability only. There is no playable board.",
    status: "planned",
    statusLabel: "Planned",
    modes: [],
  },
];

export function catalogGame(id: string): CatalogGame | null {
  return GAME_CATALOG.find((game) => game.id === id) ?? null;
}
