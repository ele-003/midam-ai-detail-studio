import { startMockWorker } from "./start-browser";

/** Service Worker 등록·활성화 대기도 생성 화면의 취소와 제한 시간에 포함한다. */
export async function prepareStudioMock(signal: AbortSignal): Promise<void> {
  signal.throwIfAborted();
  let onAbort = () => {};
  const aborted = new Promise<never>((_, reject) => {
    onAbort = () => reject(signal.reason);
    signal.addEventListener("abort", onAbort, { once: true });
  });
  try {
    await Promise.race([startMockWorker({ enabled: true }), aborted]);
  } finally {
    signal.removeEventListener("abort", onAbort);
  }
}
