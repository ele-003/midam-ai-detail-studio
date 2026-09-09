import { expect, test } from "@playwright/test";
import { readFileSync } from "node:fs";

test("좁은 모바일 편집 화면에서도 최종 검토 버튼의 문구가 잘리지 않는다", async ({
  page,
}) => {
  await page.setViewportSize({ width: 320, height: 780 });
  await page.goto("/seller/products/new?sample=car&project=sample-car");
  const review = page.getByRole("button", { name: "최종 검토하기" });
  await expect(review).toBeVisible();
  const fits = await review.evaluate((button) => {
    const bounds = button.getBoundingClientRect();
    const range = document.createRange();
    range.selectNodeContents(button);
    const text = range.getBoundingClientRect();
    return text.left >= bounds.left && text.right <= bounds.right;
  });
  expect(fits).toBe(true);
  await review.click();
  await expect(
    page.getByRole("main", { name: "상품 상세페이지" }),
  ).toBeVisible();
});

test("편집 도구와 최종 화면에서 JSON 본문의 서식을 동일하게 유지한다", async ({
  page,
}) => {
  await page.goto("/seller/products/new");
  await page.getByRole("button", { name: "JSON 텍스트 넣기" }).click();
  await page
    .getByRole("textbox", { name: "JSON 결과값" })
    .fill(readFileSync("src/e2e/fixtures/najeon-ai-result.json", "utf8"));
  await page.getByRole("button", { name: "초안 편집으로 불러오기" }).click();
  await expect(page.locator(".cv-document table")).toBeVisible();
  const snapshot = () =>
    page.locator(".cv-document [data-node-id]").evaluateAll((nodes) =>
      nodes.map((node) => {
        const style = getComputedStyle(node);
        return {
          id: node.getAttribute("data-node-id"),
          text: node.textContent,
          display: style.display,
          color: style.color,
          fontFamily: style.fontFamily,
          fontSize: style.fontSize,
          fontWeight: style.fontWeight,
          lineHeight: style.lineHeight,
          letterSpacing: style.letterSpacing,
          background: style.backgroundColor,
          padding: style.padding,
          gap: style.gap,
          border: style.border,
        };
      }),
    );
  const editing = await snapshot();
  await page.getByRole("button", { name: "최종 검토하기" }).click();
  await expect(
    page.getByRole("main", { name: "상품 상세페이지" }),
  ).toBeVisible();
  expect(await snapshot()).toEqual(editing);
});
