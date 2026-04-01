import { test as base } from '@playwright/test';
import { writeFileSync, mkdirSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const COVERAGE_DIR = resolve(__dirname, '../.nyc_output');

let coverageIndex = 0;

export const test = base.extend<object, object>({});

// Only collect when COVERAGE=true to avoid overhead in normal runs
if (process.env.COVERAGE === 'true') {
  test.afterEach(async ({ page }) => {
    const coverage = await page.evaluate(
      () => (globalThis as unknown as { __coverage__?: unknown }).__coverage__,
    );
    if (coverage) {
      mkdirSync(COVERAGE_DIR, { recursive: true });
      const fileName = resolve(COVERAGE_DIR, `coverage-${Date.now()}-${++coverageIndex}.json`);
      writeFileSync(fileName, JSON.stringify(coverage));
    }
  });
}

export { expect } from '@playwright/test';
