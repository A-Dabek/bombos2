import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  reporter: [
    ["list"],
    ["html", { outputFolder: "html-results", open: "never" }],
  ],
  timeout: 10 * 1000, // don't increase it, it will never take longer
  testDir: "./e2e",
  retries: 2,
  use: {
    baseURL: "http://localhost:4173",
    trace: "on-first-retry",
  },
  webServer: {
    command: "pnpm build && pnpm build.preview && pnpm preview",
    url: "http://localhost:4173",
    reuseExistingServer: true,
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
});
