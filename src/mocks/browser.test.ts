import { beforeEach, describe, expect, it, vi } from "vitest";

const { publicEnv, setupWorker } = vi.hoisted(() => ({
  publicEnv: { apiMocking: false },
  setupWorker: vi.fn(),
}));
vi.mock("@/lib/env", () => ({ publicEnv }));
vi.mock("msw/browser", () => ({ setupWorker }));

describe("browser mock scope", () => {
  beforeEach(() => {
    vi.resetModules();
    setupWorker.mockClear();
  });

  it("전역 목업이 꺼져 있으면 스튜디오 생성만 가로챈다", async () => {
    publicEnv.apiMocking = false;
    await import("./browser");
    const paths = setupWorker.mock.calls[0].map((handler) => handler.info.path);
    expect(paths).toEqual(["*/api/prototype/detail-studio/generations"]);
  });

  it("명시적으로 전역 목업을 켜면 기존 상품·회원 핸들러도 유지한다", async () => {
    publicEnv.apiMocking = true;
    await import("./browser");
    const paths = setupWorker.mock.calls[0].map((handler) => handler.info.path);
    expect(paths).toContain("*/api/products");
    expect(paths).toContain("*/api/member/login");
    expect(paths).toContain("*/api/prototype/detail-studio/generations");
  });
});
