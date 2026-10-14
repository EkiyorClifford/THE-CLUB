import { mkdir } from "node:fs/promises";
import path from "node:path";

import { expect, test as setup } from "@playwright/test";

const authFile = path.join("playwright", ".auth", "user.json");

setup("sign in through the club form", async ({ page }) => {
  const email = process.env.E2E_CLUB_EMAIL;
  const password = process.env.E2E_CLUB_PASSWORD;
  if (!email || !password) {
    throw new Error(
      "Set E2E_CLUB_EMAIL and E2E_CLUB_PASSWORD in .env.e2e or the environment. Do not commit them.",
    );
  }

  await page.goto("/sign-in");
  await page.getByLabel("Email").fill(email);
  await page.getByRole("textbox", { name: "Password", exact: true }).fill(password);
  await page.getByRole("button", { name: "Sign in", exact: true }).click();
  await expect(page).not.toHaveURL(/\/sign-in/, { timeout: 30_000 });
  await expect(page.getByRole("heading", { name: /Welcome back,/ })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Welcome back, Inez." })).toHaveCount(0);

  await mkdir(path.dirname(authFile), { recursive: true });
  await page.context().storageState({ path: authFile });
});
