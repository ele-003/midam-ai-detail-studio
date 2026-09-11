import { beforeEach, describe, expect, it, vi } from "vitest";

const { start } = vi.hoisted(() => ({ start: vi.fn() }));
vi.mock("@/lib/env", () => ({ publicEnv: { apiMocking: false } }));
vi.mock("./browser", () => ({ worker: { start } }));

describe("studio mock startup", () => {
  beforeEach(() => {
    vi.resetModules();
    start.mockReset().mockResolvedValue(undefined);
  });

  it("기존 부팅은 전역 플래그가 꺼져 있으면 워커를 시작하지 않는다", async () => {
    const { startMockWorker } = await import("./start-browser");
    await startMockWorker();
    expect(start).not.toHaveBeenCalled();
  });

  it("스튜디오는 전역 플래그와 별도로 시작하되 동시 요청은 같은 준비를 기다린다", async () => {
    const { startMockWorker } = await import("./start-browser");
    await Promise.all([
      startMockWorker({ enabled: true }),
      startMockWorker({ enabled: true }),
    ]);
    expect(start).toHaveBeenCalledTimes(1);
  });
});
