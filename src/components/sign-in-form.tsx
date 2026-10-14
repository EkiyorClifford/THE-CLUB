"use client";

import { useActionState, useState } from "react";

import { signIn, type SignInState } from "@/app/sign-in/actions";
import { safeNextPath } from "@/lib/auth/routes";
import { buttonClass } from "@/lib/cx";

const initial: SignInState = { error: null };

export function SignInForm({ nextPath, disabled }: { nextPath: string; disabled: boolean }) {
  const [state, action, pending] = useActionState(signIn, initial);
  const [passwordVisible, setPasswordVisible] = useState(false);

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
      <div className="block">
        <label htmlFor="password" className="text-sm font-semibold">
          Password
        </label>
        <div className="relative mt-1">
          <input
            id="password"
            name="password"
            type={passwordVisible ? "text" : "password"}
            autoComplete="current-password"
            required
            disabled={disabled}
            className="min-h-11 w-full border border-line bg-paper-raised py-2 pr-20 pl-3"
          />
          <button
            type="button"
            className="absolute inset-y-1 right-1 inline-flex min-w-16 items-center justify-center rounded-sm px-2 text-sm font-semibold text-ink"
            aria-pressed={passwordVisible}
            aria-label={passwordVisible ? "Hide password" : "Show password"}
            disabled={disabled}
            onClick={() => setPasswordVisible((visible) => !visible)}
          >
            {passwordVisible ? "Hide" : "Show"}
          </button>
        </div>
      </div>
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
