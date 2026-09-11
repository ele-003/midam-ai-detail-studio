import { readFileSync } from "node:fs";
import path from "node:path";

import { expect, test } from "@playwright/test";

const source = JSON.parse(
  readFileSync("src/e2e/fixtures/najeon-ai-result.json", "utf8").replace(
    /^\uFEFF/,
    "",
  ),
);
const document = source.document ?? source;
const photo = path.resolve("public/car-detail/images/car-original.png");

for (const mode of ["텍스트", "파일"] as const) {
  test(`테스트 이미지와 JSON ${mode}를 연결하고 저장 후 복원한다`, async ({
    page,
  }) => {
    await page.goto("/seller/products/new");
    const region = page.getByRole("region", { name: "테스트용 JSON 가져오기" });
    await expect(
      region.getByRole("textbox", { name: "연결할 이미지 ID" }),
    ).toHaveValue("sample-product");
    await region.getByLabel("JSON에 연결할 이미지 파일").setInputFiles(photo);
    await expect(region.getByRole("status")).toContainText(
      "sample-product에 연결했습니다",
    );
    if (mode === "파일") {
      const bundle = JSON.parse(
        readFileSync("public/studio/sample-product.json", "utf8").replace(
          /^\uFEFF/,
          "",
        ),
      );
      await page.getByLabel("테스트 JSON 파일").setInputFiles({
        name: "result.json",
        mimeType: "application/json",
        buffer: Buffer.from(
          JSON.stringify({ document, assets: bundle.assets }),
        ),
      });
    } else {
      await region.getByRole("button", { name: "JSON 텍스트 넣기" }).click();
      await page
        .getByRole("textbox", { name: "JSON 결과값" })
        .fill(JSON.stringify(document));
      await page
        .getByRole("button", { name: "초안 편집으로 불러오기" })
        .click();
    }
    const images = page.locator(".cv-document img");
    await expect(images).toHaveCount(3);
    const src = await images.first().getAttribute("src");
    expect(src).toMatch(/^data:image\/(webp|png|jpeg);base64,/);
    for (const image of await images.all())
      await expect(image).toHaveAttribute("src", src!);
    await page.reload();
    await expect(images.first()).toHaveAttribute("src", src!);
  });
}

test("다른 ID의 연결·교체·삭제 및 잘못된 이미지 업로드를 처리한다", async ({
  page,
}) => {
  await page.setViewportSize({ width: 375, height: 812 });
  await page.goto("/seller/products/new");
  const region = page.getByRole("region", { name: "테스트용 JSON 가져오기" });
  const id = region.getByRole("textbox", { name: "연결할 이미지 ID" });
  const upload = region.getByLabel("JSON에 연결할 이미지 파일");
  await id.fill("hero");
  await upload.setInputFiles(photo);
  await expect(region.getByRole("status")).toContainText("hero에 연결했습니다");
  const firstSrc = await region
    .getByRole("img", { name: "hero 연결 이미지" })
    .getAttribute("src");
  await upload.setInputFiles(path.resolve("public/studio/sample-product.png"));
  await expect(
    region.getByRole("img", { name: "hero 연결 이미지" }),
  ).not.toHaveAttribute("src", firstSrc!);
  await expect(region.getByRole("img")).toHaveCount(1);
  await id.fill("detail");
  await upload.setInputFiles(photo);
  await expect(region.getByRole("status")).toContainText(
    "detail에 연결했습니다",
  );
  await expect(region.getByRole("img")).toHaveCount(2);
  await upload.setInputFiles({
    name: "broken.png",
    mimeType: "image/png",
    buffer: Buffer.from("not an image"),
  });
  await expect(region.getByRole("alert")).toContainText(
    "이미지를 읽지 못했습니다",
  );
  await expect(region.getByRole("img")).toHaveCount(2);
  await region.getByRole("button", { name: "hero 연결 삭제" }).click();
  await expect(region.getByRole("img")).toHaveCount(1);
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
});

test("이미지 ID 입력 중 Enter를 눌러도 AI 생성을 시작하지 않는다", async ({
  page,
}) => {
  await page.goto("/seller/products/new");
  await page.getByLabel("작품 이미지 업로드").setInputFiles(photo);
  await page.getByRole("textbox", { name: "작품명" }).fill("작품명");
  await page.getByRole("textbox", { name: "제작 과정" }).fill("작품 설명");
  await page.getByRole("textbox", { name: "연결할 이미지 ID" }).press("Enter");
  await expect(
    page.getByRole("region", { name: "테스트용 JSON 가져오기" }),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: "AI 초안 만들기" }),
  ).toBeVisible();
});
