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
    command: isCI
      ? `npm run build && npm run start -- --port ${port}`
      : `npm run dev -- --port ${port} --webpack`,
    url: baseURL,
    reuseExistingServer: !isCI,
    timeout: 120_000,
  },
});
