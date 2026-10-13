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
  await expect(page.getByRole("listitem").filter({ hasText: "c4" })).toHaveCount(1);
  await expect(page.getByRole("button", { name: "Challenges, 2 incoming" })).toBeVisible();
});

test("a double-click records one move and restart clears a thinking turn", async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 700 });
  await page.goto("/games/reversi/practice");
  await page.getByRole("button", { name: "Start practice" }).click();
  const square = page.getByRole("gridcell", { name: "Play c4, flips 1" });
  await square.focus();
  await page.keyboard.press("Enter");
  await expect(page.getByText("Computer is thinking.")).toBeVisible();
  await page.getByRole("button", { name: "Restart" }).click();
  await expect(page.getByText("No moves yet.")).toBeVisible();
  await expect(page.getByText("Your turn.")).toBeVisible();

  await page.getByRole("gridcell", { name: "Play c4, flips 1" }).dblclick();
  await expect(page.getByText("Your turn.")).toBeVisible();
  await expect(page.getByRole("listitem").filter({ hasText: "c4" })).toHaveCount(1);

  const board = page.getByRole("grid", { name: "Reversi board" });
  const box = await board.boundingBox();
  expect(box).not.toBeNull();
  if (!box) return;
  expect(box.width).toBeLessThanOrEqual(320);
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  expect(overflow).toBeLessThanOrEqual(1);
});

test("white lets the computer move first without opening a challenge", async ({ page }) => {
  await page.goto("/games/reversi/practice");
  await page.getByRole("radio", { name: "White" }).check();
  await page.getByRole("button", { name: "Start practice" }).click();
  await expect(page.getByText("Your turn.")).toBeVisible();
  await expect(page.getByRole("listitem").first()).toContainText("Dark");
  await expect(page.getByRole("button", { name: "Challenges, 2 incoming" })).toBeVisible();
});
