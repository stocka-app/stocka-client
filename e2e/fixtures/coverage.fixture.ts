import { test as base, type Page } from '@playwright/test';
import { writeFileSync, mkdirSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const COVERAGE_DIR = resolve(__dirname, '../.nyc_output');

let coverageIndex = 0;

/**
 * Extracts `window.__coverage__` from a Playwright page and writes it to
 * `e2e/.nyc_output/`. Safe to call from any fixture teardown — the file
 * write only happens when COVERAGE=true is in the env. Used by both the
 * default `page` fixture override and by `authenticatedPage`/`preAuthPage`
 * in auth.fixture so coverage data is captured regardless of which page
 * fixture the spec consumes.
 */
export async function dumpCoverage(page: Page): Promise<void> {
  if (process.env.COVERAGE !== 'true') return;
  try {
    const coverage = await page.evaluate(
      () => (globalThis as unknown as { __coverage__?: unknown }).__coverage__,
    );
    if (coverage) {
      mkdirSync(COVERAGE_DIR, { recursive: true });
      const fileName = resolve(COVERAGE_DIR, `coverage-${Date.now()}-${++coverageIndex}.json`);
      writeFileSync(fileName, JSON.stringify(coverage));
    }
  } catch {
    // Page may have closed before extraction; ignore.
  }
}

export const test = base.extend({
  page: async ({ page }, use) => {
    await use(page);
    await dumpCoverage(page);
  },
});

export { expect } from '@playwright/test';
