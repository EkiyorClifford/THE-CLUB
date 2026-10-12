import { MatchScreen } from "@/components/match-screen";

export default async function PlayPage({ params }: { params: Promise<{ matchId: string }> }) {
  const { matchId } = await params;
  return <MatchScreen matchId={matchId} />;
}
