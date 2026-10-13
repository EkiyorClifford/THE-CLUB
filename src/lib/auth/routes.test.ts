import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

import { isPublicPath, safeNextPath } from "./routes";

describe("auth routes", () => {
  it("keeps only sign-in and the auth callback public", () => {
    expect(isPublicPath("/sign-in")).toBe(true);
    expect(isPublicPath("/auth/callback")).toBe(true);
    expect(isPublicPath("/")).toBe(false);
    expect(isPublicPath("/games/reversi/practice")).toBe(false);
    expect(isPublicPath("/games/reversi/help")).toBe(false);
    expect(isPublicPath("/games/reversi/tutorial")).toBe(false);
    expect(isPublicPath("/members/inez")).toBe(false);
  });

  it("rejects off-site return paths", () => {
    expect(safeNextPath("https://evil.example")).toBe("/");
    expect(safeNextPath("//evil.example")).toBe("/");
    expect(safeNextPath("/games/reversi/practice")).toBe("/games/reversi/practice");
  });
});

describe("profile migration", () => {
  const sql = readFileSync(join(process.cwd(), "supabase/migrations/20261013120000_profiles.sql"), "utf8");
  const grants = sql
    .split(";")
    .map((statement) => statement.replace(/--[^\n]*/g, "").replace(/\s+/g, " ").trim().toLowerCase())
    .filter((statement) => statement.startsWith("grant ") || statement.startsWith("revoke "));

  it("revokes table access from public, anon, and authenticated before the narrow grants", () => {
    expect(grants).toContain("revoke all on table public.profiles from public, anon, authenticated");
    expect(grants).toContain(
      "grant select (id, display_name, created_at, updated_at) on table public.profiles to authenticated",
    );
    expect(grants).toContain("grant update (display_name) on table public.profiles to authenticated");
    expect(grants.some((statement) => statement.startsWith("grant insert"))).toBe(false);
    expect(grants.some((statement) => statement.startsWith("grant delete"))).toBe(false);
    expect(grants.some((statement) => statement.includes("grant update on"))).toBe(false);
  });

  it("keeps row level security scoped to the signed-in user", () => {
    expect(sql.toLowerCase()).toContain("alter table public.profiles enable row level security");
    expect(sql).toContain("for select");
    expect(sql).toContain("for update");
    expect(sql).toContain("to authenticated");
    expect(sql.match(/id = \(select auth\.uid\(\)\)/g)?.length).toBe(3);
    expect(sql.toLowerCase()).not.toContain("to anon");
  });

  it("caps the initial display name and does not grant function execute to authenticated", () => {
    expect(sql).toContain("left(chosen, 80)");
    expect(sql).toContain("chosen := 'Member'");
    expect(sql).toContain("nullif(btrim(coalesce(new.raw_user_meta_data ->> 'display_name', '')), '')");
    expect(grants.filter((statement) => statement.startsWith("grant execute"))).toEqual([]);
    expect(sql.toLowerCase()).toContain(
      "revoke all on function private.handle_new_user() from public, anon, authenticated",
    );
    expect(sql.toLowerCase()).toContain(
      "revoke all on function private.set_profile_updated_at() from public, anon, authenticated",
    );
  });
});

describe("browser client source", () => {
  const source = readFileSync(join(process.cwd(), "src/lib/supabase/client.ts"), "utf8");

  it("does not read a service-role key", () => {
    expect(source).not.toMatch(/SERVICE_ROLE/);
    expect(source).toMatch(/NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY/);
  });
});
