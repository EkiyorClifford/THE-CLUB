"use client";

import { createContext, useContext } from "react";

export type SignedInAccountView = {
  displayName: string;
};

const SignedInAccountContext = createContext<SignedInAccountView | null>(null);

export function SignedInAccountProvider({
  account,
  children,
}: {
  account: SignedInAccountView | null;
  children: React.ReactNode;
}) {
  return <SignedInAccountContext.Provider value={account}>{children}</SignedInAccountContext.Provider>;
}

export function useSignedInAccount(): SignedInAccountView | null {
  return useContext(SignedInAccountContext);
}
