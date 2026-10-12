import { Thread } from "@/components/thread";

export default async function MessageThreadPage({ params }: { params: Promise<{ username: string }> }) {
  const { username } = await params;
  return <Thread username={username} />;
}
