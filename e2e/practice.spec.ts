import { expect, test } from "@playwright/test";

test("a solo Reversi game accepts a human move and answers", async ({ page }) => {
  await page.goto("/games/reversi/practice");
  await expect(page.getByRole("heading", { name: "Play vs Computer" })).toBeVisible();
  await expect(page.getByText("Practice. This table is not a challenge and it is not rated.")).toBeVisible();
  await expect(page.getByRole("radio", { name: /Easy/ })).toBeChecked();

  await page.getByRole("button", { name: "Start practice" }).click();
  await expect(page.getByText("Your turn.")).toBeVisible();

  await page.getByRole("gridcell", { name: "Play c4, flips 1" }).click();
  await expect(page.getByText("Your turn.")).toBeVisible();
  await expect(page.getByRole("listitem").nth(0)).toContainText("c4");
  await expect(page.getByRole("listitem").nth(1)).toContainText("Light");
});
