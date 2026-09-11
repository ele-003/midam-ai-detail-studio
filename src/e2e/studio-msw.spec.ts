import { expect, test } from "@playwright/test";

test("워커 준비에 실패하면 생성 요청을 보내지 않고 입력을 유지한다", async ({
  page,
}) => {
  await page.addInitScript(() => {
    Object.defineProperty(navigator.serviceWorker, "register", {
      value: () =>
        Promise.reject(new Error("Service Worker registration failed")),
    });
  });
  const generationRequests: string[] = [];
  page.on("request", (request) => {
    if (request.url().endsWith("/api/prototype/detail-studio/generations"))
      generationRequests.push(request.url());
  });
  await page.goto("/seller/products/new");
  await page
    .getByLabel("작품 이미지 업로드")
    .setInputFiles("public/studio/asset-1.png");
  await page.getByLabel("작품명", { exact: false }).fill("워커 실패 테스트");
  await page
    .getByLabel("제작 과정 · 작품 설명", { exact: false })
    .fill("준비 실패 후에도 남을 설명입니다.");
  await page
    .getByRole("button", { name: "AI 초안 만들기", exact: true })
    .click();
  await expect(page.getByRole("main").getByRole("alert")).toContainText(
    "초안을 불러오지 못했습니다",
  );
  await expect(page.getByLabel("작품명", { exact: false })).toHaveValue(
    "워커 실패 테스트",
  );
  expect(generationRequests).toEqual([]);
});

test("로그인 없이 MSW 응답을 받아 편집하고 받은 JSON을 복원한다", async ({
  page,
}) => {
  await page.goto("/seller/products/new");
  await page
    .getByLabel("작품 이미지 업로드")
    .setInputFiles("public/studio/asset-1.png");
  await page.getByLabel("작품명", { exact: false }).fill("MSW 나전 작품");
  await page
    .getByLabel("제작 과정 · 작품 설명", { exact: false })
    .fill("자개를 한 조각씩 붙인 작품입니다.");
  const responsePromise = page.waitForResponse(
    (response) =>
      response.url().endsWith("/api/prototype/detail-studio/generations") &&
      response.request().method() === "POST",
  );
  await page
    .getByRole("button", { name: "AI 초안 만들기", exact: true })
    .click();
  await expect(page.getByRole("status")).toContainText("작품의 이야기를 구성");
  const response = await responsePromise;
  expect(response.fromServiceWorker()).toBe(true);
  expect(response.request().headers()["authorization"]).toBeUndefined();
  const envelope = await response.json();
  expect(envelope.data.document.schemaVersion).toBe("2.0");
  await expect(
    page.locator(".cv-document h2 [contenteditable]").first(),
  ).toHaveText("MSW 나전 작품");
  const stored = await page.evaluate(() => {
    const key = Object.keys(localStorage).find((key) =>
      key.startsWith("midam-project-v1:"),
    );
    return key ? JSON.parse(localStorage.getItem(key)!) : null;
  });
  expect(stored.payload.document).toEqual(envelope.data.document);
  // 전역 목업이 꺼진 배포 설정에서 스튜디오가 회원·상품 목업을 켜지 않는다.
  const productStatus = await page.evaluate(
    async () => (await fetch("/api/products")).status,
  );
  expect(productStatus).toBe(404);
  await page.reload();
  await expect(
    page.locator(".cv-document h2 [contenteditable]").first(),
  ).toHaveText("MSW 나전 작품");
});

test("목업 실패 후 입력과 사진을 유지하고 다시 요청할 수 있다", async ({
  page,
}) => {
  await page.goto("/seller/products/new?mockGeneration=error");
  await page
    .getByLabel("작품 이미지 업로드")
    .setInputFiles("public/studio/asset-1.png");
  await page
    .getByLabel("작품명", { exact: false })
    .fill("실패해도 남을 작품명");
  await page
    .getByLabel("제작 과정 · 작품 설명", { exact: false })
    .fill("입력한 설명도 유지합니다.");
  await page
    .getByRole("button", { name: "AI 초안 만들기", exact: true })
    .click();
  await expect(page.getByRole("main").getByRole("alert")).toContainText(
    "초안을 불러오지 못했습니다",
  );
  await expect(page.getByLabel("작품명", { exact: false })).toHaveValue(
    "실패해도 남을 작품명",
  );
  await expect(
    page.getByRole("button", { name: "1번 이미지 삭제" }),
  ).toBeVisible();
  expect(
    await page.evaluate(() =>
      Object.keys(localStorage).filter((key) =>
        key.startsWith("midam-project-v1:"),
      ),
    ),
  ).toEqual([]);
  const retry = page.waitForResponse((response) =>
    response.url().endsWith("/api/prototype/detail-studio/generations"),
  );
  await page
    .getByRole("button", { name: "AI 초안 만들기", exact: true })
    .click();
  expect((await retry).status()).toBe(500);
});
