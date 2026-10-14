import type { Metadata } from "next";
import { Fraunces, Source_Sans_3 } from "next/font/google";
import { Suspense } from "react";

import { Shell } from "@/components/shell";
import { SignedInAccountProvider } from "@/components/signed-in-account";
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

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${sourceSans.variable} ${fraunces.variable} h-full antialiased`}>
      <body className="min-h-dvh bg-paper text-ink">
        <Suspense fallback={<ClubFrame account={null}>{children}</ClubFrame>}>
          <SignedInFrame>{children}</SignedInFrame>
        </Suspense>
      </body>
    </html>
  );
}

function ClubFrame({
  account,
  children,
}: {
  account: { displayName: string } | null;
  children: React.ReactNode;
}) {
  return (
    <ClubProvider>
      <SignedInAccountProvider account={account}>
        <Shell>{children}</Shell>
      </SignedInAccountProvider>
    </ClubProvider>
  );
}

async function SignedInFrame({ children }: { children: React.ReactNode }) {
  const account = await getSignedInAccount();
  return <ClubFrame account={account}>{children}</ClubFrame>;
}
