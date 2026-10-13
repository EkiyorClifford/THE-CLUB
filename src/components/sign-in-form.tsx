"use client";

import { useActionState } from "react";

import { signIn, type SignInState } from "@/app/sign-in/actions";
import { safeNextPath } from "@/lib/auth/routes";
import { buttonClass } from "@/lib/cx";

const initial: SignInState = { error: null };

export function SignInForm({ nextPath, disabled }: { nextPath: string; disabled: boolean }) {
  const [state, action, pending] = useActionState(signIn, initial);

  return (
    <form action={action} className="mt-6 space-y-4">
      <input type="hidden" name="next" value={safeNextPath(nextPath)} />
      <label className="block">
        <span className="text-sm font-semibold">Email</span>
        <input
          name="email"
          type="email"
          autoComplete="username"
          required
          disabled={disabled}
          className="mt-1 min-h-11 w-full border border-line bg-paper-raised px-3"
        />
      </label>
      <label className="block">
        <span className="text-sm font-semibold">Password</span>
        <input
          name="password"
          type="password"
          autoComplete="current-password"
          required
          disabled={disabled}
          className="mt-1 min-h-11 w-full border border-line bg-paper-raised px-3"
        />
      </label>
      {state.error ? (
        <p className="text-sm" role="alert">
          {state.error}
        </p>
      ) : null}
      <button type="submit" className={buttonClass.solid} disabled={disabled || pending}>
        {pending ? "Signing in" : "Sign in"}
      </button>
    </form>
  );
}
