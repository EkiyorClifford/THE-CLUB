import { redirect } from "next/navigation";

import { FriendChallenge } from "@/components/friend-challenge";

export default async function NewChallengePage({ searchParams }: { searchParams: Promise<{ member?: string }> }) {
  const { member } = await searchParams;
  if (!member) redirect("/create");
  return <FriendChallenge username={member} />;
}
