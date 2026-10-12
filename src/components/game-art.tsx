import Image from "next/image";

import type { GameId } from "@/domain/types";
import { cx } from "@/lib/cx";

const ART: Record<GameId, string> = {
  reversi: "/art/reversi.jpg",
  chess: "/art/chess.jpg",
  scrabble: "/art/scrabble.jpg",
};

export function GamePreview({
  game,
  label,
  className,
}: {
  game: GameId;
  label: string;
  className?: string;
}) {
  return (
    <Image
      src={ART[game]}
      alt={label}
      width={1200}
      height={900}
      className={cx("aspect-[4/3] h-auto w-full object-cover", className)}
    />
  );
}
