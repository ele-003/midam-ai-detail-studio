import { expect, test } from "@playwright/test";

test("새 제작 화면에서 초안을 편집하고 저장·복원·검토한다", async ({
  page,
}) => {
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.goto("/seller/products/new");
  await expect(
    page.getByRole("heading", { name: "작품의 이야기를, 상세페이지로." }),
  ).toBeVisible();
  await page.screenshot({
    path: "test-results/contract-input.png",
    fullPage: true,
  });
  await page.getByRole("button", { name: "예시 작품으로 체험하기" }).click();
  await expect(
    page.locator(".cv-document h2 [contenteditable]").first(),
  ).toBeVisible();
  await page
    .locator(".cv-document h2 [contenteditable]")
    .first()
    .fill("차 한 잔에 담긴 새로운 이야기");
  await page.locator(".cs-editor-top").click();
  await expect(page.getByText("미저장 변경사항")).toBeVisible();
  await page.getByRole("button", { name: "초안 저장", exact: true }).click();
  await expect(
    page.getByRole("article", { name: "작품 상세페이지" }),
  ).toContainText("차 한 잔에 담긴 새로운 이야기");
  await expect(
    page.getByText("이 브라우저에 저장됨", { exact: true }),
  ).toBeVisible();
  await page.reload();
  await expect(
    page.locator(".cv-document h2 [contenteditable]").first(),
  ).toHaveText("차 한 잔에 담긴 새로운 이야기");
  await page.screenshot({
    path: "test-results/contract-editor.png",
    fullPage: true,
  });
  await page.getByRole("button", { name: "최종 검토하기" }).click();
  await expect(
    page.getByRole("main", { name: "상품 상세페이지" }),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: "상품에 게시하기" }),
  ).toBeEnabled();
  await page.screenshot({
    path: "test-results/contract-result.png",
    fullPage: true,
  });
});

test("모바일 입력 화면에 가로 넘침이 없다", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/seller/products/new");
  await expect(
    page.getByRole("heading", { name: "작품의 이야기를, 상세페이지로." }),
  ).toBeVisible();
  expect(
    await page.evaluate(() => document.documentElement.scrollWidth),
  ).toBeLessThanOrEqual(390);
  await page.screenshot({
    path: "test-results/contract-mobile.png",
    fullPage: true,
  });
});

test("사용자 사진과 문구를 반영하고 저장 실패 시 편집을 유지한다", async ({
  page,
}) => {
  await page.goto("/seller/products/new");
  await page
    .getByRole("button", { name: "AI 초안 만들기", exact: true })
    .click();
  await expect(page.getByRole("main").getByRole("alert")).toContainText(
    "대표 이미지",
  );
  await page
    .getByLabel("작품 이미지 업로드")
    .setInputFiles(["public/studio/asset-1.png", "public/studio/asset-3.png"]);
  await expect(
    page.getByRole("button", { name: "2번 이미지 삭제" }),
  ).toBeVisible();
  await page.getByLabel("작품명", { exact: false }).fill("내가 만든 다기");
  await page
    .getByLabel("제작 과정 · 작품 설명", { exact: false })
    .fill("직접 만든 작품의 제작 과정입니다.");
  await page
    .getByRole("button", { name: "AI 초안 만들기", exact: true })
    .click();
  await expect(
    page.locator(".cv-document h2 [contenteditable]").first(),
  ).toHaveText("내가 만든 다기");
  await expect(page.getByText("4개 섹션", { exact: true })).toBeVisible();
  await page.getByRole("button", { name: "초안 저장", exact: true }).click();
  await page.reload();
  await expect(
    page.locator(".cv-document h2 [contenteditable]").first(),
  ).toHaveText("내가 만든 다기");
  await page
    .locator(".cv-document h2 [contenteditable]")
    .first()
    .fill("저장되지 않아도 유지될 문구");
  await page.evaluate(() => {
    Storage.prototype.setItem = () => {
      throw new DOMException("QuotaExceededError");
    };
  });
  await page.getByRole("button", { name: "최종 검토하기" }).click();
  await expect(page.getByRole("main").getByRole("alert")).toContainText(
    "편집 내용은 유지됩니다",
  );
  await expect(
    page.locator(".cv-document h2 [contenteditable]").first(),
  ).toHaveText("저장되지 않아도 유지될 문구");
});
