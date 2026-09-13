import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  reporter: [
    ["list"],
    ["html", { outputFolder: "html-results", open: "never" }],
  ],
  workers: 4,
  timeout: 10 * 1000, // don't increase it, it will never take longer
  testDir: "./e2e",
  retries: 2,
  use: {
    baseURL: "http://localhost:4173",
    trace: "on-first-retry",
    launchOptions: {
      args: ["--disable-gpu", "--no-sandbox", "--headless", "--disable-software-rasterizer", "--disable-dev-shm-usage"],
    },
  },
  webServer: {
    command: "pnpm build && pnpm build.preview && pnpm preview",
    url: "http://localhost:4173",
    reuseExistingServer: true,
    // Bypass the Google auth guard for e2e tests. See docs/adr-031-google-auth.md.
    env: {
      AUTH_DISABLED: "true",
      // Poll bills urgency faster so e2e tests don't wait a full production interval.
      BILLS_URGENT_INTERVAL_MS: "1000",
    },
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
});
