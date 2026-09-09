import { expect, test } from "@playwright/test";

test("최종 결과는 Figma 상품 상세 레이아웃으로 보이고 JSON 내용을 유지한다", async ({
  page,
}) => {
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.goto("/seller/products/new?sample=car&project=sample-car");
  await page
    .locator(".cv-document h2 [contenteditable]")
    .first()
    .fill("Figma 안에서 보여줄 나의 작품");
  await page.getByRole("button", { name: "최종 검토하기" }).click();
  const gallery = (await page.locator(".pd-gallery").boundingBox())!;
  expect(gallery.x).toBe(48);
  expect(gallery.y).toBe(170);
  expect(gallery.width).toBe(774);
  expect((await page.locator(".pd-main-image").boundingBox())!.width).toBe(660);
  expect((await page.locator(".pd-information").boundingBox())!.width).toBe(
    522,
  );
  expect((await page.locator(".pd-content").boundingBox())!.width).toBe(774);
  await expect(page.locator(".pd-json-detail")).toContainText(
    "Figma 안에서 보여줄 나의 작품",
  );
  await expect(page.locator("[contenteditable]")).toHaveCount(0);
  await page
    .locator('img[src^="/product-design/"]')
    .evaluateAll(async (images) => {
      await Promise.all(
        images.map((image) => (image as HTMLImageElement).decode()),
      );
    });
  await page.screenshot({
    path: "test-results/figma-product-desktop.png",
    fullPage: true,
  });
  await page.getByRole("button", { name: "상품 이미지 확대" }).click();
  await expect(
    page.getByRole("dialog", { name: "상품 이미지 크게 보기" }),
  ).toBeVisible();
  await page.getByRole("button", { name: "이미지 닫기" }).click();
  await page.getByRole("button", { name: "유의사항", exact: true }).click();
  await page.locator("summary", { hasText: "제품 유의사항" }).click();
  await expect(page.locator(".pd-disclosure[open]")).toContainText("관리 방법");
  await page.getByRole("button", { name: "문의하기", exact: true }).click();
  await expect(
    page.getByRole("dialog", { name: "상품 문의", exact: true }),
  ).toBeVisible();
  await page.getByRole("button", { name: "닫기", exact: true }).click();
  await page.setViewportSize({ width: 390, height: 844 });
  expect(
    await page.evaluate(() => document.documentElement.scrollWidth),
  ).toBeLessThanOrEqual(390);
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.screenshot({
    path: "test-results/figma-product-mobile.png",
    fullPage: true,
  });
  await expect(
    page.getByRole("button", { name: "편집으로 돌아가기" }),
  ).toBeVisible();
});
