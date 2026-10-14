import { describe, expect, it } from "vitest";

import { greetingName, lobbyGreeting } from "./greeting";

describe("lobby greeting", () => {
  it("uses the authenticated display name", () => {
    expect(lobbyGreeting("Papi")).toBe("Welcome back, Papi.");
    expect(greetingName("Ada Voss")).toBe("Ada");
  });

  it("does not fall back to the seeded member Inez", () => {
    expect(lobbyGreeting(null)).toBe("Welcome back.");
    expect(lobbyGreeting("")).toBe("Welcome back.");
    expect(lobbyGreeting("   ")).toBe("Welcome back.");
    expect(lobbyGreeting(undefined)).not.toMatch(/Inez/);
    expect(lobbyGreeting(null)).not.toMatch(/Inez/);
  });
});
