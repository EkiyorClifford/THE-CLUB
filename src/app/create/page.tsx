import { CreateGame } from "@/components/create-game";
import type { GameId } from "@/domain/types";

export default async function CreatePage({ searchParams }: { searchParams: Promise<{ game?: string }> }) {
  const { game } = await searchParams;
  const initialGame: GameId | null = game === "reversi" ? "reversi" : null;
  return <CreateGame initialGame={initialGame} />;
}
