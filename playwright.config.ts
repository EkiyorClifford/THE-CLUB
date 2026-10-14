import { existsSync, readFileSync } from "node:fs";

import { defineConfig, devices } from "@playwright/test";

const authFile = "playwright/.auth/user.json";

function readIgnoredE2EEnv() {
  if (!existsSync(".env.e2e")) return;
  for (const line of readFileSync(".env.e2e", "utf8").split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const separator = trimmed.indexOf("=");
    if (separator <= 0) continue;
    const key = trimmed.slice(0, separator).trim();
    if (!/^[A-Za-z_][A-Za-z0-9_]*$/.test(key)) continue;
    const dedicated = key === "E2E_CLUB_EMAIL" || key === "E2E_CLUB_PASSWORD";
    if (!dedicated && process.env[key]) continue;
    let value = trimmed.slice(separator + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    process.env[key] = value;
  }
}

readIgnoredE2EEnv();

function localBrowserChannel(): "chrome" | "msedge" | undefined {
  if (process.env.CI) return undefined;
  const channel = process.env.PW_BROWSER_CHANNEL;
  if (channel === "chrome" || channel === "msedge") return channel;
  return undefined;
}

const browserChannel = localBrowserChannel();
const installedBrowser = browserChannel ? { channel: browserChannel } : {};

export default defineConfig({
  testDir: "./e2e",
  outputDir: "playwright/results",
  fullyParallel: true,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 1 : 0,
  use: {
    baseURL: "http://localhost:3000",
    trace: "on-first-retry",
    ...installedBrowser,
  },
  webServer: {
    command: "npm run dev",
    url: "http://localhost:3000",
    reuseExistingServer: !process.env.CI,
  },
  projects: [
    { name: "setup", testMatch: /auth\.setup\.ts/, use: { ...installedBrowser } },
    {
      name: "unauthenticated",
      testMatch: /auth-gate\.spec\.ts/,
      use: { ...devices["Desktop Chrome"], ...installedBrowser },
    },
    {
      name: "chromium",
      dependencies: ["setup"],
      testIgnore: [/auth-gate\.spec\.ts/, /auth\.setup\.ts/],
      use: { ...devices["Desktop Chrome"], ...installedBrowser, storageState: authFile },
    },
  ],
});
