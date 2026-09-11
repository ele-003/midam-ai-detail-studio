import { defineConfig, devices } from "@playwright/test";

const isCI = !!process.env.CI;
const port = process.env.STUDIO_TEST_PORT ?? "3002";
const baseURL = `http://localhost:${port}`;

export default defineConfig({
  testDir: "./src/e2e",
  fullyParallel: true,
  forbidOnly: isCI,
  retries: isCI ? 2 : 0,
  reporter: isCI ? [["list"], ["html", { open: "never" }]] : "list",
  use: {
    baseURL,
    trace: "on-first-retry",
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
  webServer: {
    // 스튜디오의 단독 MSW 모드가 회원·상품 목업을 활성화하지 않는지 검증한다.
    env: { NEXT_PUBLIC_API_MOCKING: "" },
    command: isCI
      ? `npm run build && npm run start -- --port ${port}`
      : `npm run dev -- --port ${port} --webpack`,
    url: baseURL,
    reuseExistingServer: !isCI,
    timeout: 120_000,
  },
});
