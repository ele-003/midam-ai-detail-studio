import { http } from "msw";
import { describe, expect, it, vi } from "vitest";

import {
  exampleAssets,
  exampleDraft,
} from "@/components/detail-studio/studio-fixture";
import { mockError, mockOk } from "@/mocks/envelope";
import { server } from "@/mocks/server";
import { useAuthStore } from "@/stores/auth";

import { generateStudioDraft } from "./api";

const endpoint = "*/api/prototype/detail-studio/generations";

describe("studio generation MSW", () => {
  it("입력한 작품명·사진으로 만든 JSON 응답을 받는다", async () => {
    const draft = {
      ...exampleDraft,
      product_name: "새로운 다기",
      page_plan: exampleDraft.page_plan.map((section, index) =>
        index === 0 ? { ...section, title: "새로운 다기" } : section,
      ),
    };
    const result = await generateStudioDraft(draft, exampleAssets);
    expect(result.document.schemaVersion).toBe("2.0");
    expect(JSON.stringify(result.document)).toContain("새로운 다기");
    expect(result.assets).toEqual(exampleAssets);
    expect(JSON.stringify(result.document)).toContain(exampleAssets[0].imageId);
  });

  it("세션이 있어도 토큰 없이 요청하고 401에 로그인 갱신을 하지 않는다", async () => {
    useAuthStore.setState({ accessToken: "must-not-be-sent" });
    const refresh = vi.fn(() => mockOk({ accessToken: "unexpected" }));
    server.use(
      http.post(endpoint, ({ request }) => {
        expect(request.headers.get("authorization")).toBeNull();
        expect(request.credentials).toBe("omit");
        return mockError(401, "UNAUTHORIZED");
      }),
      http.post("*/api/member/token/refresh", refresh),
    );
    try {
      await expect(
        generateStudioDraft(exampleDraft, exampleAssets),
      ).rejects.toMatchObject({ status: 401 });
      expect(refresh).not.toHaveBeenCalled();
    } finally {
      useAuthStore.setState({ accessToken: null });
    }
  });

  it("생성 실패 응답은 편집 결과로 바꾸지 않고 오류로 전달한다", async () => {
    await expect(
      generateStudioDraft(exampleDraft, exampleAssets, { scenario: "error" }),
    ).rejects.toMatchObject({ status: 500 });
  });

  it("허용하지 않는 요소가 있는 JSON 응답을 거부한다", async () => {
    server.use(
      http.post(endpoint, () =>
        mockOk({
          document: {
            schemaVersion: "2.0",
            canvasWidth: 774,
            root: [{ id: "bad", type: "element", tag: "script" }],
          },
          assets: exampleAssets,
        }),
      ),
    );
    await expect(
      generateStudioDraft(exampleDraft, exampleAssets),
    ).rejects.toThrow();
  });

  it("취소된 요청의 결과는 사용하지 않는다", async () => {
    const controller = new AbortController();
    controller.abort();
    await expect(
      generateStudioDraft(exampleDraft, exampleAssets, {
        signal: controller.signal,
      }),
    ).rejects.toMatchObject({ name: "AbortError" });
  });

  it("사진 ID가 실제 에셋에 없으면 목업이 400으로 거부한다", async () => {
    const draft = {
      ...exampleDraft,
      page_plan: exampleDraft.page_plan.map((section) => ({
        ...section,
        photo_id: "missing-image",
      })),
    };
    await expect(
      generateStudioDraft(draft, exampleAssets),
    ).rejects.toMatchObject({ status: 400 });
  });
});
