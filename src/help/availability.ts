import { catalogGame, type CatalogGame } from "@/domain/games";

import { REVERSI_HELP, type HelpSection } from "./reversi-guide";

export type GameHelp =
  | { game: CatalogGame; available: true; sections: readonly HelpSection[] }
  | { game: CatalogGame; available: false; reason: string };

/** Reversi has a guide. Other catalog games stay honest until a board exists. */
export function helpFor(gameId: string): GameHelp | null {
  const game = catalogGame(gameId);
  if (!game) return null;
  if (game.id === "reversi") {
    return { game, available: true, sections: REVERSI_HELP };
  }
  return { game, available: false, reason: game.playersNote };
}
