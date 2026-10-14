import { expect, test, type Locator, type Page } from "@playwright/test";

const viewports = [
  { width: 320, height: 700 },
  { width: 375, height: 812 },
  { width: 390, height: 844 },
  { width: 1280, height: 800 },
  { width: 1440, height: 900 },
] as const;

test("the signed-in profile names the header and the lobby", async ({ page }) => {
  test.setTimeout(60_000);
  await page.goto("/");
  await expect(page.getByRole("heading", { name: "Welcome back, Papi." })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Welcome back, Inez." })).toHaveCount(0);
  await expect(page.getByText("Papi", { exact: true }).first()).toBeVisible();
  await expect(page.getByText("Sample tables stay on this device.")).toBeVisible();
  await expect(page.getByText("These boards stay on this device.")).toBeVisible();

  await page.getByRole("navigation", { name: "Club", exact: true }).getByRole("link", { name: "Games", exact: true }).click();
  await expect(page).toHaveURL(/\/games$/, { timeout: 20_000 });
  await page.goto("/");
  await expect(page.getByRole("heading", { name: "Welcome back, Papi." })).toBeVisible();

  await page.getByRole("button", { name: "Sign out" }).click();
  await expect(page).toHaveURL(/\/sign-in/, { timeout: 20_000 });
  await page.goto("/");
  await expect(page).toHaveURL(/\/sign-in/);
  await expect(page.getByRole("heading", { name: "Welcome back, Papi." })).toHaveCount(0);
});

for (const viewport of viewports) {
  test(`lobby header fits ${viewport.width}x${viewport.height}`, async ({ page }) => {
    await page.setViewportSize(viewport);
    await page.goto("/");
    await expect(page.getByRole("heading", { name: "Welcome back, Papi." })).toBeVisible();
    await expect(page.getByRole("link", { name: "The Club" })).toBeVisible();
    await expect(page.getByText("The best games are played with good company.")).toBeVisible();

    const challenges = page.getByRole("button", { name: /Challenges, \d+ incoming/ });
    const signOut = page.getByRole("button", { name: "Sign out" });
    await expect(challenges).toBeVisible();
    await expect(signOut).toBeVisible();
    await expect(page.getByText("Sample tables stay on this device.")).toBeVisible();
    await page.screenshot({
      path: `playwright/screenshots/lobby-${viewport.width}x${viewport.height}.png`,
      fullPage: true,
    });

    const overflow = await pageOverflow(page);
    expect(overflow.app, JSON.stringify(overflow)).toEqual([]);
    if (overflow.document > 1) {
      expect(overflow.overlay.length, JSON.stringify(overflow)).toBeGreaterThan(0);
    }
    expect(await overlaps(challenges, signOut)).toBe(false);

    if (viewport.width < 768) {
      const mobile = page.getByRole("navigation", { name: "Club mobile" });
      await expect(mobile).toBeVisible();
      await expect(page.getByRole("navigation", { name: "Club", exact: true })).toBeHidden();
      const navBox = await mobile.boundingBox();
      const challengeBox = await challenges.boundingBox();
      expect(navBox).not.toBeNull();
      expect(challengeBox).not.toBeNull();
      if (navBox && challengeBox) {
        expect(challengeBox.y + challengeBox.height).toBeLessThanOrEqual(navBox.y + 1);
      }
      const paddingBottom = await page
        .locator("#content")
        .evaluate((element) => Number.parseFloat(getComputedStyle(element).paddingBottom));
      expect(paddingBottom).toBeGreaterThanOrEqual((navBox?.height ?? 0) - 1);
    } else {
      await expect(page.getByRole("navigation", { name: "Club", exact: true })).toBeVisible();
      await expect(page.getByRole("navigation", { name: "Club mobile", exact: true })).toBeHidden();
    }

    await page.locator("body").click({ position: { x: 8, y: 8 } });
    for (let step = 0; step < 8; step += 1) {
      if (await challenges.evaluate((element) => element.matches(":focus-visible"))) break;
      await page.keyboard.press("Tab");
    }
    await expect(challenges).toBeFocused();
    const outline = await challenges.evaluate((element) => getComputedStyle(element).outlineStyle);
    expect(outline).not.toBe("none");
  });
}

async function pageOverflow(page: Page) {
  return page.evaluate(() => {
    const width = document.documentElement.clientWidth;
    const isOverlay = (element: Element) =>
      element.tagName === "NEXTJS-PORTAL" ||
      element.closest("nextjs-portal") !== null ||
      element.id.startsWith("__next");
    const describe = (element: Element) => {
      const rect = element.getBoundingClientRect();
      const className = typeof element.className === "string" ? element.className : "";
      return {
        tag: element.tagName.toLowerCase(),
        id: element.id,
        className: className.slice(0, 140),
        right: Math.round(rect.right),
      };
    };
    const app: ReturnType<typeof describe>[] = [];
    const overlay: ReturnType<typeof describe>[] = [];
    for (const element of document.querySelectorAll("body *")) {
      const rect = element.getBoundingClientRect();
      if (rect.width < 1 || rect.right <= width + 1) continue;
      const item = describe(element);
      if (isOverlay(element)) overlay.push(item);
      else app.push(item);
    }
    return {
      document: document.documentElement.scrollWidth - width,
      app: app.slice(0, 8),
      overlay: overlay.slice(0, 8),
    };
  });
}

async function overlaps(first: Locator, second: Locator) {
  const [a, b] = await Promise.all([first.boundingBox(), second.boundingBox()]);
  expect(a).not.toBeNull();
  expect(b).not.toBeNull();
  if (!a || !b) return true;
  return a.x < b.x + b.width && a.x + a.width > b.x && a.y < b.y + b.height && a.y + a.height > b.y;
}
