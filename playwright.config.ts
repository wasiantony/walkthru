import { defineConfig, devices } from "@playwright/test";

// End-to-end checks for the walkthrough player, run against a production build
// on port 3100. Needs the database running and seeded, with SHOW_DRAFTS=true in
// .env (the samples are drafts):
//   docker compose up -d db && npm run db:migrate && npm run db:seed
//   npm run test:e2e
// Set PLAYWRIGHT_BASE_URL to test a server that is already running instead.
const baseURL = process.env.PLAYWRIGHT_BASE_URL ?? "http://localhost:3100";

export default defineConfig({
  testDir: "./e2e",
  timeout: 120_000,
  fullyParallel: true,
  reporter: [["list"]],
  use: {
    baseURL,
    trace: "retain-on-failure",
  },
  projects: [
    { name: "chromium", use: { ...devices["Desktop Chrome"] } },
  ],
  webServer: process.env.PLAYWRIGHT_BASE_URL
    ? undefined
    : {
        command: "npm run build && npx next start -p 3100",
        url: baseURL,
        reuseExistingServer: true,
        timeout: 300_000,
      },
});
