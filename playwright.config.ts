import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: 1,
  reporter: 'html',
  timeout: 60_000,
  use: {
    // Without this, a click on an element something else is covering retries
    // FOREVER — Playwright's default action timeout is 0. A transient overlay
    // then reads as a frozen test that only the test timeout ends, which hides
    // the real fault behind tens of minutes of silence.
    actionTimeout: 15_000,
    baseURL: process.env.E2E_BASE_URL || 'http://localhost:4000',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'on-first-retry',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
});
