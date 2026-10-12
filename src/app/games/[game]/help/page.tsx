import Link from "next/link";
import { notFound } from "next/navigation";

import { HelpGuide } from "@/components/help-guide";
import { helpFor } from "@/help/availability";
import { buttonClass } from "@/lib/cx";

export const instant = false;

export default async function GameHelpPage({ params }: { params: Promise<{ game: string }> }) {
  const { game: gameId } = await params;
  const help = helpFor(gameId);
  if (!help) notFound();

  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-6 sm:px-6 sm:py-8">
      <p className="text-sm text-ink-soft">
        <Link href={`/games/${help.game.id}`} className="underline underline-offset-4">
          {help.game.name}
        </Link>
      </p>
      <p className="eyebrow mt-4">Help & Rules</p>
      <h1 className="mt-2 font-display text-4xl font-medium tracking-tight">{help.game.name}</h1>
      {help.available ? (
        <>
          <p className="mt-3 max-w-xl text-ink-soft">
            These are the rules this club uses. A short lesson shows a legal move, a flip, and a pass.
          </p>
          <div className="mt-5 flex flex-col items-start gap-2 sm:flex-row sm:flex-wrap">
            <Link href="/games/reversi/tutorial" className={buttonClass.solid}>
              Start the tutorial
            </Link>
            <Link href="/games/reversi/practice" className={buttonClass.quiet}>
              Play vs Computer
            </Link>
          </div>
          <HelpGuide sections={help.sections} />
        </>
      ) : (
        <>
          <p className="mt-3 max-w-xl">{help.game.statusLabel}</p>
          <p className="mt-3 max-w-xl text-ink-soft">{help.reason}</p>
          <p className="mt-3 max-w-xl text-ink-soft">
            There is no rules guide yet, because there is no board to agree with. This page does not invent one.
          </p>
        </>
      )}
    </div>
  );
}
