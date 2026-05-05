import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  reporter: [['list'], ['html', { outputFolder: 'html-results', open: 'never' }]],
  testDir: "./e2e",
  fullyParallel: false,
  retries: 2,
  use: {
    baseURL: "http://localhost:4173",
    trace: "on-first-retry",
  },
  webServer: {
    command: "pnpm build.preview && pnpm preview",
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
