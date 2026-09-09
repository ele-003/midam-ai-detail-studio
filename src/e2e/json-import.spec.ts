import { expect, test } from "@playwright/test";
import path from "node:path";
import { readFileSync } from "node:fs";

test("에셋 없는 원본 AI JSON도 텍스트 입력에서 나전 이미지와 연결한다", async ({
  page,
}) => {
  const bundle = JSON.parse(
    readFileSync("public/studio/sample-product.json", "utf8").replace(
      /^\uFEFF/,
      "",
    ),
  );
  await page.goto("/seller/products/new");
  await page.getByRole("button", { name: "JSON 텍스트 넣기" }).click();
  await page
    .getByRole("textbox", { name: "JSON 결과값" })
    .fill(JSON.stringify(bundle.document));
  await page.getByRole("button", { name: "초안 편집으로 불러오기" }).click();
  await expect(page.locator(".cv-document img")).toHaveCount(3);
  await expect(page.locator(".cv-document img").first()).toHaveAttribute(
    "src",
    "/studio/sample-product.png",
  );
});

test("실제 AI 샘플과 나전 이미지를 불러와 저장·복원한다", async ({ page }) => {
  await page.goto("/seller/products/new");
  await page
    .getByLabel("테스트 JSON 파일")
    .setInputFiles(path.resolve("public/studio/sample-product.json"));
  await expect(page.locator(".cv-document section")).toHaveCount(5);
  await expect(page.locator(".cv-document img")).toHaveCount(3);
  await expect(page.locator(".cv-document th").first()).toHaveAttribute(
    "scope",
    "row",
  );
  await expect(page.locator(".cv-document section").first()).toHaveCSS(
    "background-color",
    "rgb(36, 36, 36)",
  );
  await page.reload();
  await expect(page.locator(".cv-document img").first()).toHaveAttribute(
    "src",
    "/studio/sample-product.png",
  );
});

const document = {
  schemaVersion: "2.0",
  canvasWidth: 774,
  root: [
    {
      id: "section1",
      type: "element",
      tag: "section",
      children: [
        {
          id: "title",
          type: "element",
          tag: "h2",
          children: [{ id: "text1", type: "text", value: "가져온 JSON 작품" }],
        },
      ],
    },
  ],
};
test("텍스트 입력 오류를 표시하고 정상 문서를 편집·복원한다", async ({
  page,
}) => {
  await page.goto("/seller/products/new");
  await page.getByRole("button", { name: "JSON 텍스트 넣기" }).click();
  await page.getByRole("textbox", { name: "JSON 결과값" }).fill("{");
  await page.getByRole("button", { name: "초안 편집으로 불러오기" }).click();
  await expect(page.getByRole("dialog").getByRole("alert")).toContainText(
    "JSON 문법",
  );
  await page
    .getByRole("textbox", { name: "JSON 결과값" })
    .fill(JSON.stringify(document));
  await page.getByRole("button", { name: "초안 편집으로 불러오기" }).click();
  await expect(page.locator(".cv-document h2 [contenteditable]")).toHaveText(
    "가져온 JSON 작품",
  );
  await page.reload();
  await expect(page.locator(".cv-document h2 [contenteditable]")).toHaveText(
    "가져온 JSON 작품",
  );
});
test("JSON 파일과 이미지 에셋을 가져온다", async ({ page }) => {
  await page.goto("/seller/products/new");
  const data = {
    document: {
      ...document,
      root: [
        {
          ...document.root[0],
          children: [
            ...document.root[0].children,
            {
              id: "photo",
              type: "element",
              tag: "img",
              props: { imageId: "car", alt: "자동차 테스트" },
            },
          ],
        },
      ],
    },
    assets: [
      {
        imageId: "car",
        url: "/car-detail/images/car-1280.webp",
        width: 1280,
        height: 786,
        alt: "자동차 테스트",
        asset_mode: "source",
        product_generated: false,
        fidelity_status: "FALLBACK",
      },
    ],
  };
  await page.getByLabel("테스트 JSON 파일").setInputFiles({
    name: "test.json",
    mimeType: "application/json",
    buffer: Buffer.from(JSON.stringify(data)),
  });
  await expect(page.locator(".cv-document img")).toHaveAttribute(
    "src",
    "/car-detail/images/car-1280.webp",
  );
  await page.reload();
  await expect(page.locator(".cv-document img")).toHaveAttribute(
    "src",
    "/car-detail/images/car-1280.webp",
  );
});
