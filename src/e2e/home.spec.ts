import { expect, test } from "@playwright/test";

test("renders the seller workspace", async ({ page }) => {
  await page.goto("/");
  await expect(page).toHaveTitle(/장인몰/);
  await expect(page.getByRole("main")).toContainText("제작한 상세페이지");
});
