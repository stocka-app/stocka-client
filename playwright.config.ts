import { defineConfig, devices } from '@playwright/test';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

// Load .env.e2e — only sets vars that are not already in the environment
// so that explicit shell exports always take precedence.
try {
  const envContent = readFileSync(resolve(__dirname, '.env.e2e'), 'utf8');
  for (const line of envContent.split('\n')) {
    const match = /^([^#=\s][^=]*)=(.*)$/.exec(line.trim());
    if (match) {
      const key = match[1].trim();
      const value = match[2].trim();
      if (process.env[key] === undefined) {
        process.env[key] = value;
      }
    }
  }
} catch {
  // .env.e2e not found — fall back to defaults in config below
}

/**
 * Playwright E2E configuration for stocka-client.
 *
 * Environment variables are loaded from .env.e2e (see .env.e2e.example).
 * Shell exports always take precedence over the file.
 *
 * The E2E backend must be running before tests:
 *   DB_DATABASE=stocka_playwright PORT=3002 npm run start:dev  (in stocka-server)
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
    command: 'vite --config vite.e2e.config.ts',
    url: process.env.PW_BASE_URL ?? 'http://localhost:5174',
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
});
