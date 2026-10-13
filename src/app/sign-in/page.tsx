import { SignInForm } from "@/components/sign-in-form";
import { readPublicSupabaseConfig } from "@/lib/supabase/config";

export default async function SignInPage({
  searchParams,
}: {
  searchParams: Promise<{ reason?: string; next?: string }>;
}) {
  const params = await searchParams;
  const configured = readPublicSupabaseConfig(process.env) !== null;
  const reason = params.reason === "configuration" || !configured ? "configuration" : params.reason;

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-md flex-col justify-center px-4 py-10">
      <p className="eyebrow">Invite only</p>
      <h1 className="mt-2 font-display text-4xl font-medium tracking-tight">Sign in</h1>
      <p className="mt-3 text-ink-soft">
        The Club does not offer public registration. An administrator creates your account, then you sign in here.
      </p>
      {reason === "configuration" ? (
        <p className="mt-4 border-t border-ink pt-3 text-sm" role="alert">
          Supabase is not configured for this process. The sample member is not used as a signed-in person.
        </p>
      ) : null}
      {reason === "callback" ? (
        <p className="mt-4 border-t border-ink pt-3 text-sm" role="alert">
          The sign-in link could not be confirmed. Ask the administrator to send a new one.
        </p>
      ) : null}
      <SignInForm nextPath={params.next ?? "/"} disabled={!configured} />
    </main>
  );
}
