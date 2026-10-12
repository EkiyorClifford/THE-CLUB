import Link from "next/link";
import { notFound } from "next/navigation";

import { GamePreview } from "@/components/game-art";
import { catalogGame } from "@/domain/games";
import { buttonClass } from "@/lib/cx";

export default async function GameDetailPage({ params }: { params: Promise<{ game: string }> }) {
  const { game: gameId } = await params;
  const game = catalogGame(gameId);
  if (!game) notFound();
  const playable = game.status === "playable";

  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-6 sm:px-6 sm:py-8">
      <p className="text-sm text-ink-soft">
        <Link href="/games" className="underline underline-offset-4">
          Games
        </Link>
      </p>
      <div className="mt-4 border border-line bg-paper-raised">
        <GamePreview game={game.id} label={`${game.name} board preview`} />
        <div className="p-4 sm:p-6">
          <p className="eyebrow">{game.statusLabel}</p>
          <h1 className="mt-2 font-display text-4xl font-medium">{game.name}</h1>
          <p className="mt-3 max-w-xl text-ink-soft">{game.summary}</p>
          <p className="mt-4 text-sm font-semibold">{game.players}</p>
          <p className="text-sm text-ink-soft">{playable ? game.modes.join(" · ") : game.playersNote}</p>
          {playable ? (
            <Link href="/create?game=reversi" className={`${buttonClass.solid} mt-5`}>
              Set up Reversi
            </Link>
          ) : (
            <p className="mt-5 max-w-xl text-sm text-ink-soft">
              This preview is the game as the club intends it. It does not open a match.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
