import type { Metadata } from "next";
import { Fraunces, Source_Sans_3 } from "next/font/google";

import { Shell } from "@/components/shell";
import { getSignedInAccount } from "@/lib/auth/account";
import { ClubProvider } from "@/prototype/store";

import "./globals.css";

const sourceSans = Source_Sans_3({
  subsets: ["latin"],
  variable: "--font-source",
});

const fraunces = Fraunces({
  subsets: ["latin"],
  variable: "--font-display-family",
});

export const metadata: Metadata = {
  title: {
    default: "The Club",
    template: "%s · The Club",
  },
  description: "A private board-game club for Reversi, and later chess and Scrabble.",
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const account = await getSignedInAccount();

  return (
    <html lang="en" className={`${sourceSans.variable} ${fraunces.variable} h-full antialiased`}>
      <body className="min-h-dvh bg-paper text-ink">
        <ClubProvider>
          <Shell account={account}>{children}</Shell>
        </ClubProvider>
      </body>
    </html>
  );
}
