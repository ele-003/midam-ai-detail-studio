import { beforeEach, describe, expect, it, vi } from "vitest";

const { startMockWorker } = vi.hoisted(() => ({ startMockWorker: vi.fn() }));
vi.mock("./start-browser", () => ({ startMockWorker }));

import { prepareStudioMock } from "./prepare-studio";

describe("studio worker readiness", () => {
  beforeEach(() => {
    startMockWorker.mockReset();
  });

  it("워커 준비가 멈춰도 제한 시간이 지나면 호출자가 실패를 처리할 수 있다", async () => {
    startMockWorker.mockReturnValue(new Promise(() => {}));
    const controller = new AbortController();
    const result = prepareStudioMock(controller.signal);
    controller.abort(new DOMException("timeout", "TimeoutError"));
    await expect(result).rejects.toMatchObject({ name: "TimeoutError" });
  });

  it("화면을 벗어나 취소된 요청은 워커 시작도 하지 않는다", async () => {
    const controller = new AbortController();
    controller.abort();
    await expect(prepareStudioMock(controller.signal)).rejects.toMatchObject({
      name: "AbortError",
    });
    expect(startMockWorker).not.toHaveBeenCalled();
  });

  it("준비 실패 후 다시 호출해서 성공할 수 있다", async () => {
    startMockWorker
      .mockRejectedValueOnce(new Error("worker unavailable"))
      .mockResolvedValueOnce(undefined);
    await expect(
      prepareStudioMock(new AbortController().signal),
    ).rejects.toThrow("worker unavailable");
    await expect(
      prepareStudioMock(new AbortController().signal),
    ).resolves.toBeUndefined();
  });
});
