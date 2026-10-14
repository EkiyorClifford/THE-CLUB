import { expect, test } from "@playwright/test";

test("an unauthenticated visit does not enter the sample club", async ({ page }) => {
  await page.goto("/");
  await expect(page).toHaveURL(/\/sign-in/);
  await expect(page.getByRole("heading", { name: "Sign in" })).toBeVisible();
  await expect(page.getByRole("textbox", { name: "Password", exact: true })).toBeVisible();
  await expect(page.getByText("Welcome back, Inez.")).toHaveCount(0);
  await expect(page.getByRole("heading", { name: /Welcome back,/ })).toHaveCount(0);
});
