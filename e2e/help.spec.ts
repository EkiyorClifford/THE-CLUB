import { expect, test } from "@playwright/test";

test("Help & Rules opens from the game card and teaches one move", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");
  await page.getByRole("link", { name: "Help & Rules" }).click();
  await expect(page.getByRole("heading", { level: 1, name: "Reversi" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Legal moves" })).toBeVisible();
  await expect(page.getByText("Empty squares are not awarded")).toBeVisible();

  await page.getByRole("link", { name: "Start the tutorial" }).click();
  await expect(page.getByRole("heading", { name: "The opening" })).toBeVisible();
  const board = page.getByRole("grid", { name: "Reversi board" });
  const box = await board.boundingBox();
  expect(box).not.toBeNull();
  if (!box) return;
  expect(box.width).toBeLessThanOrEqual(390);
  expect(Math.abs(box.width - box.height)).toBeLessThan(12);

  await page.getByRole("button", { name: "Continue" }).focus();
  await page.keyboard.press("Enter");
  await expect(page.getByRole("heading", { name: "A legal move" })).toBeVisible();
  await page.getByRole("gridcell", { name: "Play d3, flips 1" }).click();
  await expect(page.getByText("Not yet. d3 is legal, but this step asks for c4.")).toBeVisible();
  await page.getByRole("gridcell", { name: "Play c4, flips 1" }).click();
  await expect(page.getByText("Correct. c4 flips d4, and it is White to move.")).toBeVisible();

  await page.getByRole("button", { name: "Continue" }).click();
  await expect(page.getByRole("heading", { name: "The flip" })).toBeVisible();
  await page.getByRole("button", { name: "Back" }).click();
  await expect(page.getByRole("heading", { name: "A legal move" })).toBeVisible();
  await page.getByRole("button", { name: "Show me" }).click();
  await expect(page.getByText("Correct. Shown: c4 flips the disc on d4.")).toBeVisible();

  await page.getByRole("button", { name: "Continue" }).click();
  await page.getByRole("button", { name: "Continue" }).click();
  await expect(page.getByRole("heading", { name: "No legal move" })).toBeVisible();
  await page.getByRole("button", { name: "Pass", exact: true }).click();
  await expect(page.getByText("Correct. Black passes. White can play c8.")).toBeVisible();
  await page.getByRole("button", { name: "Continue" }).click();
  await expect(page.getByRole("heading", { name: "Ready to play" })).toBeVisible();
  await page.getByRole("button", { name: "Restart tutorial" }).click();
  await expect(page.getByRole("heading", { name: "The opening" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Challenges, 2 incoming" })).toBeVisible();
});

test("direct help routes stay honest for Reversi, Chess, and Scrabble", async ({ page }) => {
  await page.goto("/games/reversi");
  await page.getByRole("link", { name: "Help & Rules" }).click();
  await expect(page).toHaveURL(/\/games\/reversi\/help$/);
  await expect(page.getByRole("heading", { level: 1, name: "Reversi" })).toBeVisible();

  await page.goto("/games/reversi/tutorial");
  await expect(page.getByRole("heading", { name: "The opening" })).toBeVisible();
  await expect(page.getByText("This lesson does not start a match.")).toBeVisible();

  await page.goto("/games/chess/help");
  await expect(page.getByRole("heading", { level: 1, name: "Chess" })).toBeVisible();
  await expect(page.getByText("No board is offered yet.")).toBeVisible();
  await expect(page.getByText("There is no rules guide yet")).toBeVisible();
  await expect(page.getByRole("link", { name: "Start the tutorial" })).toHaveCount(0);

  await page.goto("/games/scrabble/help");
  await expect(page.getByRole("heading", { level: 1, name: "Scrabble" })).toBeVisible();
  await expect(page.getByText("There is no playable board.")).toBeVisible();
  await expect(page.getByRole("link", { name: "Start the tutorial" })).toHaveCount(0);
});

test("practice links to Help & Rules", async ({ page }) => {
  await page.goto("/games/reversi/practice");
  await page.getByRole("link", { name: "Help & Rules" }).click();
  await expect(page.getByRole("heading", { level: 2, name: "No legal move" })).toBeVisible();
});
