import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: false,
  workers: 1,
  retries: 0,
  timeout: 120_000,
  expect: { timeout: 20_000 },
  use: {
    baseURL: "http://localhost:3001",
    trace: "retain-on-failure",
  },
  projects: [
    { name: "chrome", use: { channel: "chrome" } },
  ],
  // NOTE: Next.js 16 runs a single dev server per project. E2E reuses the
  // developer's running instance (npm run dev) instead of booting a second one.
  webServer: {
    command: "npm run dev -- --port 3001",
    port: 3001,
    reuseExistingServer: true,
    timeout: 180_000,
  },
});
