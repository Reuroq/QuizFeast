// Separate Playwright config for synthetic user-journey tests in tests/journeys/.
// Runs against production by default; override with PLAYWRIGHT_BASE_URL.
//
// Local: npm run test:journeys (uses dev server)
// Prod:  npm run test:journeys:prod (hits quizfeast.onrender.com)

import { defineConfig, devices } from '@playwright/test';

const PROD_URL = 'https://quizfeast.onrender.com';

export default defineConfig({
  testDir: './tests/journeys',
  // Journey tests are end-to-end visitor flows — give them more breathing room
  // than the unit-level e2e suite.
  timeout: 60_000,
  expect: { timeout: 10_000 },
  fullyParallel: false,        // Sequential — reduces Render starter-plan throttling
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 1,
  workers: 1,                   // 1 worker against prod = polite traffic
  reporter: process.env.CI ? [['github'], ['list']] : 'list',
  use: {
    baseURL: process.env.PLAYWRIGHT_BASE_URL || PROD_URL,
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    actionTimeout: 15_000,
    navigationTimeout: 20_000,
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
  // No webServer block — journeys ALWAYS run against an already-running URL
  // (prod by default). They simulate real visitors, so spinning up dev
  // would change what they're measuring.
});
