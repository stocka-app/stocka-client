# E2E Playwright Optimization Plan

## Root Causes
1. **Rate limiting** — sign-up hits progressive limit (5 → 10min, 8 → 60min). `fetchWithRetry` honors `Retry-After` → fixture timeouts at 60s
2. **UI sign-in per test** — `authenticatedPage` does full browser form-fill + waitForURL per test
3. **retries: 1 locally** — 25 failures × 60s × 2 retries ≈ 50min

## Implementation Checklist

### S1 — playwright.config.ts (quick wins)
- [ ] `retries: process.env.CI ? 1 : 0`
- [ ] `timeout: 15_000` (was 60_000)

### S2 — api.helper.ts (fail-fast on rate limit)
- [ ] `fetchWithRetry`: if `delaySeconds > 30`, throw immediately with descriptive error

### S3 — globalSetup: pre-seed users + storageState
- [ ] Create `verifiedUser` (with tenant) via API after truncateAll
- [ ] Create 2x `onboardingUser` (no tenant) via API
- [ ] Save creds to `e2e/.auth/users.json`
- [ ] Launch Chromium, sign in as verifiedUser, save `storageState` to `e2e/.auth/user.json`
- [ ] Add `e2e/.auth/*.json` to `.gitignore`

### S4 — auth.fixture.ts: load from file + storageState
- [ ] `verifiedUser`: read from `e2e/.auth/users.json` — zero API calls
- [ ] `authenticatedPage`: `browser.newContext({ storageState: 'e2e/.auth/user.json' })` → goto /dashboard

### S5 — onboarding.fixture.ts: load from file with counter
- [ ] `verifiedUser`: load `onboardingUsers[counter % 2]` from `users.json` using file-based counter

### S6 — storage-rbac.spec.ts: storageState-based auth
- [ ] `setupAndSignIn`: register mocks first, then navigate directly to `/storages` (storageState pre-loaded in context)
- [ ] Use a new `preAuthenticatedPage` fixture that provides a page context with storageState pre-loaded

### S7 — Backend: E2E_MODE rate limit bypass
- [ ] `sign-up.controller.ts`: disable progressive blocking when `process.env.E2E_MODE === 'true'`
- [ ] Start E2E backend with `E2E_MODE=true DB_DATABASE=stocka_playwright PORT=3002`

### S8 — Parallelism (after S3-S7)
- [ ] `workers: process.env.CI ? 1 : 2`

## Expected times
| State | Estimated |
|---|---|
| Baseline | ~35-40 min |
| + S1 + S2 | ~10 min |
| + S3-S7 | ~5-7 min |
| + S8 | ~3-4 min |
