import { expect, test } from "@playwright/test";

test("검토만 마친 작업은 편집 중이고 게시 후 홈에서 게시 중으로 보인다", async ({
  page,
}) => {
  await page.goto("/seller/products/new?sample=car&project=sample-car");
  await page.getByRole("button", { name: "최종 검토하기" }).click();
  await page.getByRole("link", { name: "나의 작업실로 돌아가기" }).click();
  await page.getByRole("button", { name: "게시 중", exact: true }).click();
  await expect(page.locator(".sh-card")).toHaveCount(0);
  await page.getByRole("button", { name: "편집 중", exact: true }).click();
  await page.getByRole("link", { name: /블랙 SUV/ }).click();
  await page.getByRole("button", { name: "상품에 게시하기" }).click();
  await expect(page).toHaveURL("/");
  await page.getByRole("button", { name: "게시 중", exact: true }).click();
  await expect(page.locator(".sh-card")).toHaveCount(1);
  await page.reload();
  await page.getByRole("link", { name: /블랙 SUV/ }).click();
  await expect(
    page.getByRole("button", { name: "게시 중", exact: true }),
  ).toBeDisabled();
  await expect(page.locator("[contenteditable]")).toHaveCount(0);
  await page.getByRole("button", { name: "게시 내리고 편집" }).click();
  await page.getByRole("link", { name: "나의 작업실", exact: true }).click();
  await page.getByRole("button", { name: "게시 중", exact: true }).click();
  await expect(page.locator(".sh-card")).toHaveCount(0);
});

test("게시 저장 실패 시 홈으로 이동하지 않고 검토 내용을 유지한다", async ({
  page,
}) => {
  await page.goto("/seller/products/new?sample=car&project=sample-car");
  await page.getByRole("button", { name: "최종 검토하기" }).click();
  await page.evaluate(() => {
    Storage.prototype.setItem = () => {
      throw new DOMException("QuotaExceededError");
    };
  });
  await page.getByRole("button", { name: "상품에 게시하기" }).click();
  await expect(page.getByRole("main").getByRole("alert")).toContainText(
    "편집 내용은 유지됩니다",
  );
  await expect(
    page.getByRole("button", { name: "상품에 게시하기" }),
  ).toBeEnabled();
  await expect(page).toHaveURL(/sample=car/);
});
