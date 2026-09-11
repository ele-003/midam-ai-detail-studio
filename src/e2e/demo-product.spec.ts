import { expect, test } from "@playwright/test";

test.beforeEach(async ({ page }) => {
  await page.goto("/seller/products/new?sample=car&project=sample-car");
  await page.getByRole("button", { name: "최종 검토하기" }).click();
});

test("최종 결과의 빈 정보에 노션 시연 데이터를 표시한다", async ({ page }) => {
  await expect(page.locator(".pd-price")).toHaveText("89,000원");
  await expect(page.locator(".pd-author h2")).toHaveText("김영수");
  await expect(page.locator(".pd-author")).toContainText("국가무형유산 이수자");
  await expect(page.locator(".pd-author")).toContainText("나전장");
  await expect(page.locator(".pd-author")).toContainText(
    "30년간 전통 나전 기법",
  );
  await page.getByRole("button", { name: "더보기", exact: true }).click();
  await expect(page.locator(".pd-author")).toContainText(
    "국화문을 완성했습니다",
  );
  for (const value of [
    "백자, 옻칠, 자개",
    "85 × 85 × H65mm",
    "180g",
    "찻잔 2점, 보관용 상자 1개, 작품 보증서 1부",
    "차를 마시는 다기 및 선물용",
    "국가무형유산 전승자 제작 작품",
    "대한민국",
  ]) {
    await expect(page.locator(".pd-specs")).toContainText(value);
  }
  await expect(page.locator(".pd-order-fields")).toContainText(
    "약 2주간의 제작 기간 소요",
  );
  await expect(page.locator(".pd-order-fields")).toContainText(
    "3,000원 (100,000원 이상 무료)",
  );
  await expect(page.locator(".pd-options select")).toHaveCount(2);
  await expect(page.locator(".pd-total strong")).toHaveText("137,000원");
  await expect(page.locator(".pd-json-detail")).toContainText("블랙 SUV");
});

test("세트·선물 옵션과 수량에 따라 총 상품 금액과 배송비가 바뀐다", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page
    .getByRole("combobox", { name: "필수 옵션 · 세트 구성" })
    .selectOption({ label: "2인 세트" });
  await page
    .getByRole("combobox", { name: "선물 옵션 · 선물 포장 여부" })
    .selectOption({ label: "선택 안 함" });
  await expect(page.locator(".pd-total strong")).toHaveText("89,000원");
  await expect(page.getByLabel("적용 배송비")).toHaveText("3,000원");
  await page.getByRole("button", { name: "수량 늘리기" }).click();
  await expect(page.locator(".pd-total strong")).toHaveText("178,000원");
  await expect(page.getByLabel("적용 배송비")).toHaveText("무료");
  await page.getByRole("button", { name: "수량 줄이기" }).click();
  await expect(page.locator(".pd-total strong")).toHaveText("89,000원");
  await expect(
    page.getByRole("button", { name: "수량 줄이기" }),
  ).toBeDisabled();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
});
