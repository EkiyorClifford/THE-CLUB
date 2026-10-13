import { describe, expect, it } from "vitest";

import { readPublicSupabaseConfig } from "./config";

describe("public Supabase config", () => {
  it("returns null when the URL or publishable key is missing", () => {
    expect(readPublicSupabaseConfig({})).toBeNull();
    expect(readPublicSupabaseConfig({ NEXT_PUBLIC_SUPABASE_URL: "https://example.supabase.co" })).toBeNull();
    expect(
      readPublicSupabaseConfig({
        NEXT_PUBLIC_SUPABASE_URL: "  ",
        NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: "sb_publishable_example",
      }),
    ).toBeNull();
  });

  it("does not treat a service-role value as a signed-in user", () => {
    const config = readPublicSupabaseConfig({
      NEXT_PUBLIC_SUPABASE_URL: "https://example.supabase.co",
      NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: "sb_publishable_example",
      SUPABASE_SERVICE_ROLE_KEY: "secret-value",
    });
    expect(config).toEqual({
      url: "https://example.supabase.co",
      publishableKey: "sb_publishable_example",
    });
    expect(JSON.stringify(config)).not.toContain("secret-value");
  });
});
