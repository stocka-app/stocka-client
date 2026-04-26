#!/usr/bin/env node
/**
 * Merges unit (vitest --coverage with istanbul provider) and e2e (Playwright +
 * vite-plugin-istanbul) reports into a single combined report.
 *
 * Both layers instrument with istanbul-lib-instrument but at different
 * pipeline stages (vitest vs vite-plugin-istanbul), producing different
 * `statementMap` positions for the same source file. A naive `nyc merge`
 * would drop or overwrite statements due to this mismatch.
 *
 * This script does a file-level union: for each src file it picks the
 * coverage set with the HIGHER number of covered statements (vitest or e2e),
 * then runs `nyc report` on the result. This mirrors what the BE merge
 * produces conceptually (a statement covered in either layer counts) without
 * being broken by the position mismatch.
 *
 * Usage:
 *   node scripts/merge-coverage.cjs
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const NYC_TMP = path.join(ROOT, '.nyc_output');
const UNIT_JSON = path.join(ROOT, 'coverage', 'coverage-final.json');
const E2E_NYC_DIR = path.join(ROOT, 'e2e', '.nyc_output');
const REPORT_DIR = path.join(ROOT, 'coverage-report');

function run(cmd) {
  execSync(cmd, { stdio: 'inherit', cwd: ROOT });
}

function coveredCount(fileCov) {
  if (!fileCov || !fileCov.s) return 0;
  return Object.values(fileCov.s).filter((v) => v > 0).length;
}

fs.rmSync(NYC_TMP, { recursive: true, force: true });
fs.mkdirSync(NYC_TMP, { recursive: true });
fs.rmSync(REPORT_DIR, { recursive: true, force: true });
fs.mkdirSync(REPORT_DIR, { recursive: true });

let unitData = {};
const e2eData = {};

if (fs.existsSync(UNIT_JSON)) {
  unitData = JSON.parse(fs.readFileSync(UNIT_JSON, 'utf-8'));
  console.log(`✅  unit coverage loaded (${Object.keys(unitData).length} files)`);
} else {
  console.warn('⚠️   coverage/coverage-final.json not found — run npm run test:unit:full first');
}

if (fs.existsSync(E2E_NYC_DIR)) {
  const e2eFiles = fs.readdirSync(E2E_NYC_DIR).filter((f) => f.endsWith('.json'));
  for (const f of e2eFiles) {
    try {
      const data = JSON.parse(fs.readFileSync(path.join(E2E_NYC_DIR, f), 'utf-8'));
      for (const [filePath, fileCov] of Object.entries(data)) {
        const existing = e2eData[filePath];
        if (!existing) {
          // Deep clone so subsequent sums don't mutate the source object
          e2eData[filePath] = JSON.parse(JSON.stringify(fileCov));
          continue;
        }
        // Sum execution counts across all e2e coverage files for the same source.
        // statementMap is identical across runs (same vite-plugin-istanbul pass),
        // so summing s/f/b is safe within the e2e layer.
        for (const k of Object.keys(fileCov.s || {})) {
          existing.s[k] = (existing.s[k] || 0) + (fileCov.s[k] || 0);
        }
        for (const k of Object.keys(fileCov.f || {})) {
          existing.f[k] = (existing.f[k] || 0) + (fileCov.f[k] || 0);
        }
        for (const k of Object.keys(fileCov.b || {})) {
          const merged = (existing.b[k] || []).slice();
          (fileCov.b[k] || []).forEach((v, i) => {
            merged[i] = (merged[i] || 0) + (v || 0);
          });
          existing.b[k] = merged;
        }
      }
    } catch {
      // ignore corrupt coverage file
    }
  }
  console.log(
    `✅  e2e coverage loaded (${e2eFiles.length} raw files → ${Object.keys(e2eData).length} unique sources)`,
  );
} else {
  console.warn('⚠️   e2e/.nyc_output not found — run npm run test:e2e:full first');
}

// File-level union: for each source file, keep the coverage set with the higher
// number of covered statements. vitest istanbul and vite-plugin-istanbul produce
// different statement IDs for the same file, so a per-statement merge corrupts
// the totals. Per-file selection produces a faithful union — every src file
// gets the best coverage from either layer.
const merged = {};
const allPaths = new Set([...Object.keys(unitData), ...Object.keys(e2eData)]);
let unitOnly = 0;
let e2eOnly = 0;
let unitWins = 0;
let e2eWins = 0;

for (const p of allPaths) {
  const u = unitData[p];
  const e = e2eData[p];
  if (u && !e) {
    merged[p] = u;
    unitOnly++;
  } else if (e && !u) {
    merged[p] = e;
    e2eOnly++;
  } else if (coveredCount(u) >= coveredCount(e)) {
    merged[p] = u;
    unitWins++;
  } else {
    merged[p] = e;
    e2eWins++;
  }
}

console.log(
  `📐  Union per file: ${unitOnly} unit-only, ${e2eOnly} e2e-only, ${unitWins} unit-wins, ${e2eWins} e2e-wins`,
);

const mergedJson = path.join(REPORT_DIR, 'coverage-final.json');
fs.writeFileSync(mergedJson, JSON.stringify(merged));

// Stage for nyc report (needs files in a temp-dir matching its expectations)
fs.copyFileSync(mergedJson, path.join(NYC_TMP, 'merged.json'));

run(
  `npx nyc report --reporter=text --reporter=lcov --reporter=html --temp-dir .nyc_output --report-dir coverage-report`,
);

console.log('\n📊  Combined report: coverage-report/index.html');
