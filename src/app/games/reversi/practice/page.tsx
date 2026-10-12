import type { Metadata } from "next";

import { SoloReversi } from "@/components/solo-reversi";

export const metadata: Metadata = {
  title: "Reversi practice",
  description: "Practice Reversi against the computer. The match is not rated.",
};

export default function ReversiPracticePage() {
  return <SoloReversi />;
}
