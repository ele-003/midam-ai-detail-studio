import { expect, test } from "@playwright/test";

test("홈에서 자동차 작업을 게시하고 게시 상태로 다시 연다", async ({
  page,
}) => {
  await page.goto("/");
  await expect(
    page.getByRole("heading", { name: /제작한 상세페이지/ }),
  ).toBeVisible();
  await expect(page.locator(".sh-card")).toHaveCount(2);
  await page.screenshot({
    path: "test-results/studio-home.png",
    fullPage: true,
  });
  await page.getByRole("link", { name: /블랙 SUV/ }).click();
  const steps = page.getByRole("navigation", { name: "상세페이지 제작 단계" });
  await expect(steps.locator(":scope > div")).toHaveCount(4);
  await expect(steps.locator('[aria-current="step"]')).toContainText(
    "초안 확인",
  );
  await expect(page.getByText("원본 JSON 미리보기")).toHaveCount(0);
  const canvas = page.getByRole("article", { name: "작품 상세페이지" });
  await expect(canvas.locator(":scope > section")).toHaveCount(6);
  await canvas.locator("img").evaluateAll(async (images) => {
    await Promise.all(
      images.map((image) => (image as HTMLImageElement).decode()),
    );
  });
  await page
    .locator(".cv-document h2 [contenteditable]")
    .first()
    .fill("나만의 자동차 이야기");
  await page.getByRole("button", { name: "최종 검토하기" }).click();
  await expect(
    page.getByRole("main", { name: "상품 상세페이지" }),
  ).toBeVisible();
  await page.getByRole("button", { name: "상품에 게시하기" }).click();
  await page.getByRole("button", { name: "게시 중", exact: true }).click();
  await expect(page.locator(".sh-card")).toHaveCount(1);
  await page.getByRole("link", { name: /블랙 SUV/ }).click();
  await expect(
    page.getByRole("main", { name: "상품 상세페이지" }),
  ).toBeVisible();
  await expect(canvas).toContainText("나만의 자동차 이야기");
  await page.getByRole("button", { name: "게시 내리고 편집" }).click();
  await expect(
    page.locator(".cv-document h2 [contenteditable]").first(),
  ).toHaveText("나만의 자동차 이야기");
});

test("새 작업은 네 단계를 거쳐 별도 항목으로 저장되고 새 입력을 방해하지 않는다", async ({
  page,
}) => {
  await page.goto("/");
  await page.getByRole("link", { name: /새 상세페이지 만들기/ }).click();
  await page
    .getByLabel("작품 이미지 업로드")
    .setInputFiles("public/car-detail/images/car-original.png");
  await page.getByLabel("작품명", { exact: false }).fill("새 자동차 작업");
  await page
    .getByLabel("제작 과정 · 작품 설명", { exact: false })
    .fill("사진 속 외관을 소개하는 상세페이지입니다.");
  await page
    .getByRole("button", { name: "AI 초안 만들기", exact: true })
    .click();
  const steps = page.getByRole("navigation", { name: "상세페이지 제작 단계" });
  await expect(steps.locator('[aria-current="step"]')).toContainText("생성 중");
  await expect(
    page.locator(".cv-document h2 [contenteditable]").first(),
  ).toHaveText("새 자동차 작업");
  await page.getByRole("button", { name: "최종 검토하기" }).click();
  await page.getByRole("link", { name: "나의 작업실로 돌아가기" }).click();
  await expect(page.locator(".sh-card")).toHaveCount(3);
  await page.getByRole("link", { name: /새 자동차 작업/ }).click();
  await expect(
    page.getByRole("main", { name: "상품 상세페이지" }),
  ).toBeVisible();
  await page.getByRole("link", { name: "나의 작업실로 돌아가기" }).click();
  await page.getByRole("link", { name: /새 상세페이지 만들기/ }).click();
  await expect(page.getByLabel("작품명", { exact: false })).toHaveValue("");
  await expect(steps.locator('[aria-current="step"]')).toContainText(
    "작품 정보 입력",
  );
});

test("모바일 홈에서 작업을 열 수 있고 가로 넘침이 없다", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");
  await expect(page.locator(".sh-card")).toHaveCount(2);
  expect(
    await page.evaluate(() => document.documentElement.scrollWidth),
  ).toBeLessThanOrEqual(390);
  await page.screenshot({
    path: "test-results/studio-home-mobile.png",
    fullPage: true,
  });
  await page.getByRole("link", { name: /블랙 SUV/ }).click();
  await expect(
    page.getByRole("article", { name: "작품 상세페이지" }),
  ).toBeVisible();
  expect(
    await page.evaluate(() => document.documentElement.scrollWidth),
  ).toBeLessThanOrEqual(390);
});
