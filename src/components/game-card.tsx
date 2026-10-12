import Link from "next/link";

import type { CatalogGame } from "@/domain/games";
import { buttonClass, cx } from "@/lib/cx";

import { GamePreview } from "./game-art";

export function GameCard({ game }: { game: CatalogGame }) {
  const playable = game.status === "playable";
  return (
    <article className="flex h-full flex-col overflow-hidden rounded-lg border border-line bg-paper-raised">
      <GamePreview game={game.id} label={`${game.name} board`} />
      <div className="flex flex-1 flex-col p-3 sm:p-4">
        <h3 className="font-display text-2xl leading-none font-medium">{game.name}</h3>
        <p className="mt-2 flex items-center gap-2 text-sm">
          <span
            className={cx(
              "size-2 shrink-0 rounded-full",
              game.status === "playable" && "bg-online",
              game.status === "soon" && "bg-brass",
              game.status === "planned" && "border border-ink-faint",
            )}
            aria-hidden="true"
          />
          {game.statusLabel}
        </p>
        <p className="mt-1 text-sm text-ink-soft">
          {game.players}
          {playable ? ` · ${game.modes.join(" · ")}` : ""}
        </p>
        <p className="mt-2 line-clamp-2 text-sm text-ink-soft">{playable ? game.summary : game.playersNote}</p>
        <div className="mt-auto pt-3">
          {playable ? (
            <Link href="/create?game=reversi" className={buttonClass.solid}>
              Set up Reversi
            </Link>
          ) : (
            <Link href={`/games/${game.id}`} className={buttonClass.quiet}>
              Learn more
            </Link>
          )}
        </div>
      </div>
    </article>
  );
}
