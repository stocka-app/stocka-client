import { defineConfig, devices } from '@playwright/test';

/**
 * Playwright E2E configuration for stocka-client.
 *
 * Required env vars (see .env.e2e.example):
 *   PW_DATABASE_URL   – PostgreSQL connection to stocka_playwright DB
 *   PW_BASE_URL       – Frontend base URL (default: http://localhost:5173)
 *
 * The backend must be running against stocka_playwright before running e2e:
 *   DB_DATABASE=stocka_playwright npm run start:dev  (in stocka-server)
 */
export default defineConfig({
  testDir: './e2e/specs',

  // Run tests serially to preserve DB isolation between tests
  fullyParallel: false,
  workers: 1,

  // CI behaviour
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 1,

  reporter: [['html', { open: 'never' }], ['list']],

  globalSetup: './e2e/global-setup.ts',
  globalTeardown: './e2e/global-teardown.ts',

  // Increased timeout to accommodate backend rate-limit retries during fixture setup.
  // The backend's short throttle (1 sign-in/s) and medium throttle (5 sign-in/60s)
  // can delay fixture setup when tests run back-to-back.
  timeout: 60_000,

  use: {
    baseURL: process.env.PW_BASE_URL ?? 'http://localhost:5173',
    locale: 'en-US', // Tests always run in English for deterministic selectors
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },

  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],

  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:5173',
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
});
