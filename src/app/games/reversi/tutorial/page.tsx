import type { Metadata } from "next";

import { ReversiTutorial } from "@/components/reversi-tutorial";

export const instant = false;

export const metadata: Metadata = {
  title: "Reversi tutorial",
  description: "A short Reversi lesson: a legal move, a flip, and a pass.",
};

export default function ReversiTutorialPage() {
  return <ReversiTutorial />;
}
