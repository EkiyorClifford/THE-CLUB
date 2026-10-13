# Supabase setup

The Club uses Supabase Auth and a `public.profiles` table. There is no connected project in this repository. Nothing below has been applied to a remote database.

Accounts are invite-only. This app does not offer public registration. An administrator creates users in the Supabase dashboard. Do not put a service-role key in the browser, and do not set one for this phase.

## 1. Project

Create or select a project at [supabase.com/dashboard](https://supabase.com/dashboard). In Project Settings → API, copy the project URL and the publishable key. Do not copy the secret or service-role key into this app.

## 2. Local configuration

Create `.env.local` in the repository root. It is gitignored. Use placeholders of your own. Do not commit it.

```bash
NEXT_PUBLIC_SUPABASE_URL=https://YOUR_PROJECT_REF.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=sb_publishable_YOUR_KEY
```

If either value is missing, the app sends every private page to `/sign-in` and does not treat the sample member as signed in.

## 3. Migration

The SQL file is `supabase/migrations/20261013120000_profiles.sql`.

With the Supabase CLI linked to the project you intend to change:

```bash
supabase db push
```

Or paste that file into the dashboard SQL editor and run it once. This repository has not run either command against a remote project.

The migration creates `public.profiles`, enables row level security, and lets a signed-in user read and rename only the row whose id is `auth.uid()`. A trigger in the `private` schema inserts that row when Auth creates a user.

## 4. Provision a test account

In the dashboard, open Authentication → Users → Add user. Set an email and password. Confirm the user if the project requires it. Optional user metadata `display_name` is copied once into the profile. It is not used for authorization.

## 5. Redirect URLs

In Authentication → URL configuration, add:

- Site URL: `http://localhost:3000`
- Redirect URL: `http://localhost:3000/auth/callback`

Email links and OAuth, if you enable them later, must return to that callback. Password sign-in from the form does not need a browser redirect, but the callback route is there for those links.

## 6. Run locally

```bash
npm install
npm run dev
```

Open `http://localhost:3000`. You should land on Sign in. After a provisioned user signs in, the header shows that profile's display name. Sign out returns to Sign in.

## 7. Still local only

Challenges, friends, messages, the sample member directory, and same-device Reversi tables stay in `sessionStorage`. They are not this account's remote club. Solo practice, the tutorial, and Help & Rules still use the local Reversi engine. Multiplayer, ratings, and invitations are not implemented.
