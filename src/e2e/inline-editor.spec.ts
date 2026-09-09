import { expect, test } from "@playwright/test";

test("문구를 모두 지우고 저장해도 다시 클릭해서 입력할 수 있다", async ({
  page,
}) => {
  await page.goto("/seller/products/new?sample=car&project=sample-car");
  const text = page.locator(".cv-document h2 [contenteditable]").first();
  await text.fill("");
  await page.getByRole("button", { name: "초안 저장", exact: true }).click();
  await page.reload();
  await expect(text).toBeVisible();
  await text.click();
  await page.keyboard.insertText("다시 작성한 제목");
  await page.getByRole("button", { name: "초안 저장", exact: true }).click();
  await page.reload();
  await expect(text).toHaveText("다시 작성한 제목");
});

test("직접 입력·색상·이미지 이동을 저장하고 복원한다", async ({ page }) => {
  await page.goto("/seller/products/new?sample=car&project=sample-car");
  await expect(
    page.getByRole("heading", { name: "페이지 구성" }),
  ).toBeVisible();
  await expect(
    page.getByRole("heading", { name: "섹션 문구 편집" }),
  ).toHaveCount(0);
  const hero = page.locator(".cv-document > section").first();
  const text = hero.locator("h2 [contenteditable]");
  await text.fill("직접 타이핑한 자동차\n두 번째 줄");
  await page.getByRole("button", { name: "초안 저장", exact: true }).click();
  await text.click({ button: "right" });
  await page.getByRole("button", { name: "빨강", exact: true }).click();
  await expect(hero.locator("h2")).toHaveCSS("color", "rgb(180, 35, 24)");
  await page.getByRole("button", { name: "실행 취소", exact: true }).click();
  await expect(hero.locator("h2")).not.toHaveCSS("color", "rgb(180, 35, 24)");
  await page.getByRole("button", { name: "다시 실행", exact: true }).click();
  const figureId = await hero.locator("figure").getAttribute("data-node-id");
  await hero.locator("img").click();
  await page
    .getByRole("button", { name: "앞으로 이동 ↑", exact: true })
    .click();
  await expect(hero.locator(":scope > *").nth(2)).toHaveAttribute(
    "data-node-id",
    figureId!,
  );
  await page.getByRole("button", { name: "초안 저장", exact: true }).click();
  await page.reload();
  await expect(text).toHaveText("직접 타이핑한 자동차\n두 번째 줄");
  await expect(hero.locator("h2")).toHaveCSS("color", "rgb(180, 35, 24)");
  await expect(hero.locator(":scope > *").nth(2)).toHaveAttribute(
    "data-node-id",
    figureId!,
  );
  await page.screenshot({
    path: "test-results/inline-editor.png",
    fullPage: true,
  });
  await page.getByRole("button", { name: "최종 검토하기" }).click();
  await expect(page.locator("[contenteditable]")).toHaveCount(0);
});

test("드래그 핸들로 같은 섹션 안에서 이미지를 옮긴다", async ({ page }) => {
  await page.goto("/seller/products/new?sample=car&project=sample-car");
  const hero = page.locator(".cv-document > section").first();
  await hero.locator("img").click();
  const figureId = await hero.locator("figure").getAttribute("data-node-id");
  await page
    .getByRole("button", { name: "선택한 요소 이동", exact: true })
    .dragTo(hero.locator("h2"), { targetPosition: { x: 20, y: 5 } });
  await expect(hero.locator(":scope > *").nth(1)).toHaveAttribute(
    "data-node-id",
    figureId!,
  );
});
