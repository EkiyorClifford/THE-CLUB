import { expect, test } from "@playwright/test";

test("the lobby names the club and the member", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { name: "Welcome back, Inez." })).toBeVisible();
  await expect(page.getByRole("button", { name: "Challenges, 2 incoming" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Choose a game" })).toBeVisible();
  await expect(page.getByRole("link", { name: "Set up Reversi" }).first()).toBeVisible();
});
