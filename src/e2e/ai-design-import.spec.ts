import { readFileSync } from "node:fs";

import { expect, test } from "@playwright/test";

test("제품 정보는 열이 정렬된 표로 표시되고 셀 편집을 유지한다", async ({
  page,
}) => {
  await page.goto("/seller/products/new");
  await page.getByRole("button", { name: "JSON 텍스트 넣기" }).click();
  await page
    .getByRole("textbox", { name: "JSON 결과값" })
    .fill(readFileSync("src/e2e/fixtures/najeon-ai-result.json", "utf8"));
  await page.getByRole("button", { name: "초안 편집으로 불러오기" }).click();
  const table = page.locator(".cv-document table");
  await expect(table).toHaveCSS("display", "table");
  await expect(table.locator("tbody")).toHaveCSS("display", "table-row-group");
  await expect(table.locator("th").first()).toHaveCSS("padding-left", "16px");
  await expect(table.locator("td").first()).toHaveCSS(
    "border-bottom-style",
    "solid",
  );
  const cells = await table
    .locator("td")
    .evaluateAll((nodes) =>
      nodes.map((node) => node.getBoundingClientRect().x),
    );
  expect(Math.max(...cells) - Math.min(...cells)).toBeLessThan(1);
  await table.locator("td [contenteditable]").first().fill("수정한 보관함");
  await page.locator(".cs-editor-top").click();
  await page.getByRole("button", { name: "초안 저장", exact: true }).click();
  await page.reload();
  await expect(table.locator("td").first()).toHaveText("수정한 보관함");
  await page
    .getByRole("button", { name: "최종 검토하기", exact: true })
    .click();
  await expect(table).toHaveCSS("display", "table");
  await expect(table.locator("td").first()).toHaveText("수정한 보관함");
  await page
    .locator('[data-node-id="section-05-spec-root"]')
    .screenshot({ path: "test-results/ai-product-table.png" });
});

test("새 AI JSON의 grid 정렬을 받아 편집·복원한다", async ({ page }) => {
  const json = readFileSync("src/e2e/fixtures/najeon-ai-result.json", "utf8");
  await page.goto("/seller/products/new");
  await page.getByRole("button", { name: "JSON 텍스트 넣기" }).click();
  await page.getByRole("textbox", { name: "JSON 결과값" }).fill(json);
  await page.getByRole("button", { name: "초안 편집으로 불러오기" }).click();
  await expect(page.locator(".cv-document section")).toHaveCount(6);
  const cards = page.locator('[data-node-id="section-02-features-cards"]');
  await expect(cards).toHaveCSS("display", "grid");
  await expect(cards).toHaveCSS("align-items", "stretch");
  await expect(cards.locator("article")).toHaveCount(3);
  await expect(page.locator(".cv-document h2").first()).toHaveCSS(
    "font-size",
    "40px",
  );
  await page.reload();
  await expect(cards.locator("article")).toHaveCount(3);
});

test("잘못된 속성의 경로와 이름을 알려준다", async ({ page }) => {
  const doc = JSON.parse(
    readFileSync("src/e2e/fixtures/najeon-ai-result.json", "utf8"),
  );
  doc.root[1].children[1].props.layout.onClick = "alert(1)";
  await page.goto("/seller/products/new");
  await page.getByRole("button", { name: "JSON 텍스트 넣기" }).click();
  await page
    .getByRole("textbox", { name: "JSON 결과값" })
    .fill(JSON.stringify(doc));
  await page.getByRole("button", { name: "초안 편집으로 불러오기" }).click();
  const error = page.getByRole("dialog").getByRole("alert");
  await expect(error).toContainText("root[1].children[1].props.layout");
  await expect(error).toContainText("onClick");
});
