# Stocka Frontend E2E Coverage Execution Plan

**Goal**: Achieve **100% E2E coverage** across the entire React 19 + Vite frontend.  
**Current State**: 51.88% coverage across all modules.  
**Constraint**: **NO mocks** — all tests must hit the real NestJS backend on port 3001.

---

## Executive Summary

This plan organizes the remaining coverage work into **5 sequential phases**, ordered by:
1. **Impact on overall %** (highest coverage gain per effort)
2. **Dependency order** (infrastructure before features)
3. **Complexity** (simpler modules before complex ones)

**Total estimated effort**: ~220–250 hours over 4–5 weeks.

| Phase | Focus | Current % | Target % | Est. Specs | Est. Hours |
|---|---|---|---|---|---|
| 🔧 **Phase 1** | Auth module deep-dive + infrastructure fixes | 9–68% | 95%+ | +8 specs | 35h |
| 🏗️ **Phase 2** | Shared components, stores, hooks | 45–91% | 100% | +12 specs | 40h |
| 📦 **Phase 3** | Onboarding + Organization (rewrite without mocks) | 6–19% | 95%+ | +15 specs | 50h |
| 👥 **Phase 4** | Team module (rewrite without mocks) | ~17% | 95%+ | +10 specs | 40h |
| 🎯 **Phase 5** | Edge cases, error states, RBAC combos | Varies | 100% | +25 specs | 55h |

---

## Phase Breakdown

### 🔧 Phase 1: Authentication Module Deep-Dive (Weeks 1–1.5)

**Objective**: Take the auth module from 9–68% to 95%+ coverage. Auth is foundational — all other tests depend on it.

#### Current State

| File | Coverage | Issue |
|---|---|---|
| `api/authentication.service.ts` | 9.52% | **Critical**: 90% untested (OAuth, password reset, token refresh edge cases) |
| `hooks/useAuthentication.ts` | 100% | ✅ Already covered |
| `hooks/useOAuthPopup.ts` | 26.78% | Popup window mechanics, error handling |
| `components/LoginForm.tsx` | 37.5% | Form validation happy path only; error states missing |
| `components/RegisterForm.tsx` | 7.14% | Almost entirely untested; validation, API errors, success flow |
| `components/VerifyEmailForm.tsx` | 2.66% | Code input, resend logic, expiration edge cases |
| `components/ExpirationTimer.tsx` | 0% | Timer countdown, expiration behavior |
| `components/ResendButton.tsx` | 0% | Rate limit button state, cooldown UI |
| `components/VerificationCodeInput.tsx` | 0% | Input masking, paste behavior, validation |
| `guards/EmailVerifiedGuard.tsx` | 0% | Redirect logic when not verified |
| `guards/VerificationRoute.tsx` | 0% | Access control, state validation |
| `store/authentication.store.ts` | 20% | Store mutations, error states, persistence |
| `pages/LoginPage.tsx` | 100% | ✅ Already covered |
| `pages/all others` | 0% | RegisterPage, VerifyEmailPage, ForgotPasswordPage, ResetPasswordPage |

#### Specs to Create

**Group 1: LoginForm Edge Cases** (2 specs, 10 tests)
- Email validation: invalid formats, edge cases (spaces, special chars)
- Password validation: weak passwords, max length
- Network errors: 500, 503, timeout
- Rate limiting: 429 responses
- Invalid credentials flow
- Remember me / auto-login behavior

**Group 2: RegisterForm Happy + Error Paths** (3 specs, 18 tests)
- Successful registration → email sent
- Email already exists → error message
- Username already exists → error message
- Password strength validation
- Terms of service acceptance
- Email verification countdown post-register
- Network errors during registration

**Group 3: Email Verification** (2 specs, 14 tests)
- Verify with valid code → redirect to dashboard
- Invalid/expired code → error + resend button enabled
- Resend logic: rate limit (can't resend within 60s), success feedback
- Timer countdown: shows expiration time, auto-disables code input
- Copy-paste code into input (masking)
- Re-send email → new code generated on BE

**Group 4: OAuth + Popup Handling** (1 spec, 8 tests)
- Google OAuth popup opens → user approves → redirected to callback
- Facebook OAuth popup → approves
- Popup blocked → error message, fallback
- Popup close without auth → no side effects
- Token refresh during OAuth flow

**Group 5: Guards + Routes** (1 spec, 6 tests)
- EmailVerifiedGuard: unverified user → can't access dashboard
- VerificationRoute: non-pending user → redirected
- ProtectedRoute: unauthenticated → login
- PublicRoute: authenticated → dashboard
- RequiresTenantRoute: tenant required, null → onboarding

#### Key Challenges

1. **OAuth popup mechanics**: Requires Playwright's `page.waitForPopup()` + `popup.goto()`. Window communication needs no mocks.
2. **Email verification codes**: Must be real codes from BE. Setup: create user, verify DB-generated code, inject into form.
3. **Rate limiting**: 429 responses from BE; must test retry logic in service layer.
4. **Token refresh during auth**: Ensure 401 → silent refresh → retry works in auth context.

#### Infrastructure Needed

- ✅ `auth.fixture.ts` already exists with pre-auth page
- ✅ `api.helper.ts` provides `apiSignUp`, `apiCompleteOnboarding`
- ⚠️ Add `apiOAuthInitiate()` + `apiOAuthCallback()` to api.helper
- ⚠️ Add DB helper for: `getVerificationCodeForEmail()`, `setPasswordResetToken()`, `expireVerificationCode()`
- ✅ `auth.page.ts` (page object) exists

#### Estimated Effort

- **35 hours total**
  - Test writing: 20h (complex OAuth, timing, DB coordination)
  - Infrastructure: 8h (DB helpers, API wrappers)
  - Debugging/stabilization: 7h

#### Exit Criteria

- ✅ All auth module files ≥90% coverage
- ✅ All E2E specs pass without mocks (real BE)
- ✅ OAuth popup flow validated end-to-end
- ✅ Token refresh + 401 retry tested in auth context

---

### 🏗️ Phase 2: Shared Code + Global Infrastructure (Weeks 1.5–2.5)

**Objective**: Take shared components, stores, and hooks from 45–91% to 100%.

#### Current State

| File | Coverage | Issue |
|---|---|---|
| `store/rbac.store.ts` | 60% | Store logic mostly covered; some mutations missing |
| `store/theme.store.ts` | 46.15% | Theme toggle, dark mode persistence |
| `store/upgrade-modal.store.ts` | 100% | ✅ Already covered |
| `shared/hooks/useTierCapabilities.ts` | 86.36% | Edge cases in tier limit checks |
| `shared/components/Dialog.tsx` | 71.42% | Modal variants, close behavior |
| `shared/components/ErrorBoundary.tsx` | 15.78% | **Critical**: Error catching, fallback UI, logging |
| `shared/components/AvatarWithFallback.tsx` | 35.71% | Avatar render, fallback initials |
| `shared/components/IconColorPicker.tsx` | 58.97% | Color selection, preview, accessibility |
| `shared/components/ThemeToggle.tsx` | 100% | ✅ Already covered |
| `shared/components/LanguageSwitcher.tsx` | 60% | Language change, localStorage persist, UI update |
| `shared/components/TierUpgradeState.tsx` | 0% | **Critical**: Tier-specific UI, upgrade flow |
| `shared/layouts/AppLayout.tsx` | 72.72% | Layout render, nav structure |
| `shared/layouts/AuthenticationLayout.tsx` | 100% | ✅ Already covered |
| `shared/lib/axios.ts` | 68.49% | Interceptors tested partially; 401 refresh, timeout edge cases |
| `shared/lib/jwt.ts` | 87.5% | Token parsing, expiration, edge cases |

#### Specs to Create

**Group 1: RBAC Store** (2 specs, 12 tests)
- Load permissions → store updates
- Evaluate permission → matches DB state
- Cascading permission chains (Admin > Editor > Viewer)
- Grant-based permission override
- Store persistence across page reload
- Permission changes → UI updates

**Group 2: Theme Store** (1 spec, 6 tests)
- Toggle dark mode → localStorage persists
- System preference detection on first load
- Override system preference → manual toggle sticks
- Theme change → CSS class applied to `<html>`
- Multiple tabs: one changes theme → other reflects it

**Group 3: Error Boundary** (2 specs, 12 tests)
- Component throws in render → boundary catches → fallback UI shown
- Error logging → error service called
- Reset button → re-mounts child component
- Nested boundaries: inner catches first
- Error in useEffect → caught by boundary
- Async error (Promise rejection) → NOT caught (browser level)

**Group 4: Tier Limits + TierUpgradeState** (2 specs, 14 tests)
- Tier FREE: 0 warehouses → can't create storage (button disabled)
- Tier FREE: upgrade CTA visible
- Tier STARTER: 3 warehouse limit → 4th creation blocked with modal
- Tier GROWTH: 10 warehouse limit
- Tier ENTERPRISE: unlimited
- Upgrade modal: shows current tier, next tier benefits, pricing link

**Group 5: Axios Interceptors + Token Refresh** (1 spec, 8 tests)
- Request: Bearer token added automatically
- 401 → attempts refresh → retries original request
- Refresh fails → logout, redirect to login
- 429 rate limit → exponential backoff (no mocks)
- Timeout (30s) → error handling
- Network error → retry logic

**Group 6: Language Switcher + i18n** (1 spec, 8 tests)
- Change language EN → ES → page content updates
- Language persists in localStorage
- Accept-Language header sent on requests
- Locale-specific formatting (dates, numbers)
- Missing translations → fallback to EN
- i18next pluralization

#### Infrastructure Needed

- ✅ Basic store tests can be unit tests; E2E specs for persistence + cross-tab behavior
- ⚠️ Playwright utilities for: multi-tab testing, localStorage inspection
- ✅ Coverage fixture already set up

#### Estimated Effort

- **40 hours total**
  - Store + hook tests: 15h (unit + E2E)
  - Component tests: 12h (error boundary, dialogs, pickers)
  - Interceptor tests: 8h (token refresh, retry logic)
  - Stabilization: 5h

#### Exit Criteria

- ✅ All shared files ≥95% coverage
- ✅ Theme persistence across tabs validated
- ✅ Error boundary catches + logs errors
- ✅ Axios 401 → refresh → retry works end-to-end

---

### 📦 Phase 3: Onboarding + Organization (Weeks 2.5–3.5)

**Objective**: Onboarding from 6–19% → 95%+; Organization from current mocks → real BE without `page.route()`.

#### Current State: Organization

| File | Coverage | Issue |
|---|---|---|
| `api/organization.service.ts` | Low | Service calls not tested; error handling missing |
| `hooks/useOrganization.ts` | Low | Hook logic untested |
| `store/organization.store.ts` | Low | Store mutations, error states |
| `pages/OrganizationSettingsPage.tsx` | Low | Page logic, tab switching, forms |
| `components/*` | Mixed | Profile card, quotas, audit log, edit form, danger zone |

**Current Problem**: All 19 tests use `page.route()` mocks (RBAC, profile, quotas, audit log, etc.). Must rewrite without mocks.

#### Current State: Onboarding

| File | Coverage | Issue |
|---|---|---|
| `api/onboarding.service.ts` | 6.66% | Almost entirely untested |
| `hooks/useOnboarding.ts` | 0.84% | Hook logic missing |
| `store/onboarding.store.ts` | 8.33% | Store mutations untested |
| `pages/OnboardingPage.tsx` | Very low | Wizard flow, step validation, submission |
| `guards/OnboardingGuard.tsx` | 0% | Access control when tenant is null |

#### Specs to Create

**Group 1: Onboarding Flow (Real BE)** (3 specs, 21 tests)
- Create tenant: fill org name → choose tier → submit → tenant created on BE
- Store initialization: after onboarding, tenant in JWT + store
- Multiple step validation: cannot skip required fields
- Tier selection: FREE → show storage limits; STARTER → show invite CTA
- Data persistence during wizard: navigate back → data intact
- Validation errors from BE (name unavailable) → show error + allow retry
- Post-onboarding redirect: → /dashboard (not back to onboarding)

**Group 2: Organization Settings Profile Tab (Real BE)** (2 specs, 14 tests)
- Load profile → GET /api/tenants/me/profile → display name, status, tier
- Edit organization name → PATCH → form submits → profile updates
- Edit organization name unavailable → error from BE → show error, keep form
- Business type selector → dropdown, display current selection
- RFC field → validation (format), edit + save
- Logo upload → file picker, preview, POST endpoint
- Suspension status → show banner if suspended, disable editing

**Group 3: Organization Settings Limits Tab (Real BE)** (2 specs, 12 tests)
- Load quotas → GET /api/tenants/me/quotas → show progress bars
- Warehouses: 1/3 used → visualize quota
- Members: 2/5 used
- Products: 45/1000 used
- Upgrade CTA: click → opens pricing modal
- Quota exceeded flow: user at 3/3 warehouses → try to create 4th → error modal with upgrade CTA

**Group 4: Organization Settings Audit Log Tab (Real BE)** (2 specs, 10 tests)
- Only visible if user has REPORT_ADVANCED permission
- Load audit log → GET /api/tenants/me/audit-log
- Display table: timestamp, actor, action, details
- Pagination: if >20 entries → next/prev buttons
- Action filter: filter by action type (e.g., PROFILE_UPDATED, MEMBER_REMOVED)
- Timestamp filter: date range picker
- Viewer role: tab hidden (RBAC guard)

**Group 5: Organization Settings Danger Zone** (1 spec, 8 tests)
- Only visible to OWNER
- Transfer ownership: select member → confirm → BE updates → show new owner
- Cancel organization: confirm dialog → explain consequences → submit → org cancelled
- Cancellation: triggers data deletion, emails owner confirmation
- Timeout after cancel: can't undo (or show undo window if implemented)

**Group 6: Onboarding Post-Completion** (1 spec, 6 tests)
- After onboarding, user should not see onboarding again
- OnboardingGuard: tenant is set → allow navigation
- OnboardingGuard: tenant is null → redirect to onboarding
- Refresh page during onboarding → state persists from store + JWT

#### Key Challenges

1. **Rewriting organization specs without mocks**:
   - Current: `page.route()` for RBAC, profile, quotas, audit log
   - New: Real API calls, actual DB state, real RBAC permissions
   - Solution: Use `setTierByUserUuid()`, add `setPermissionsByUserTenant()` DB helper
   
2. **Onboarding tenant creation on real BE**: Must create actual tenant row in DB, verify it.

3. **Quota hitting**: Need to pre-create N storages so quotas are realistic.

4. **Audit log seeding**: Must insert audit entries into DB so pagination/filtering can be tested.

#### Infrastructure Needed

- ⚠️ Rewrite `organization.helper.ts` to use real API calls (no `page.route()`)
- ⚠️ Create `onboarding.helper.ts` for setup + navigation
- ⚠️ Add DB helpers:
  - `setPermissionsByUserTenant(userId, tenantId, actions)` — set RBAC permissions
  - `insertAuditLogEntries(tenantId, entries)` — seed audit table
  - `createStoragesForQuotaTest(tenantId, count)` — pre-populate storages to test quota
- ✅ Pages and services mostly exist; just need specs

#### Estimated Effort

- **50 hours total**
  - Rewriting organization specs: 20h (removing mocks, re-implementing with real BE)
  - Creating onboarding specs: 15h (wizard flow, multi-step, validation)
  - DB helpers + seeding: 8h
  - Debugging coordination between FE + BE: 7h

#### Exit Criteria

- ✅ All organization specs rewritten without `page.route()` mocks
- ✅ All onboarding specs cover happy path + error paths
- ✅ Real tenant creation on BE validated
- ✅ Quota enforcement tested end-to-end
- ✅ RBAC guards evaluated correctly (no mock permissions)

---

### 👥 Phase 4: Team Module (Weeks 3.5–4.5)

**Objective**: Team from ~17% → 95%+ coverage. Rewrite without mocks (like organization).

#### Current State

| File | Coverage | Issue |
|---|---|---|
| `api/team.service.ts` | Low | API calls not fully tested |
| `hooks/useTeam.ts` | Low | Hook logic missing |
| `hooks/usePermission.ts` | Low | Permission evaluation untested |
| `store/team.store.ts` | Low | Store mutations |
| `pages/TeamSettingsPage.tsx` | Low | Page structure, RBAC guards |
| `components/*` | Mixed | Members table, invite modal, permission gates, role change, removal confirm |

**Current Problem**: 1 spec with 17 tests using `page.route()` mocks (members, invitations, permissions). Must rewrite without mocks.

#### Specs to Create

**Group 1: Members List (Real BE)** (2 specs, 14 tests)
- Load members → GET /api/tenants/:id/members → display table
- Show member: email, name, role, join date, status
- Member actions: OWNER can remove/change role; EDITOR cannot
- Pagination: >10 members → paginate
- Sort by: name, role, join date
- Search members: by email/name
- Viewer role: no action buttons visible

**Group 2: Invite Members** (2 specs, 15 tests)
- Open invite modal → form visible
- Enter email → validate format
- Email already member → error message
- Invite → POST /api/tenants/:id/members/invite → invitation sent
- Rate limit: can't send >5 invites/min (test with real 429)
- Invitation token: BE generates, email sent (mock email service OK; don't mock API)
- Pending invitation: shows in table with "Pending" badge
- Resend invitation: click → new token generated

**Group 3: Role Changes (Real BE)** (1 spec, 10 tests)
- Select role dropdown for member
- Change VIEWER → EDITOR → confirm modal
- Confirm → PATCH /api/tenants/:id/members/:memberId → role updated
- Invalid role change (downgrade OWNER when only 1 owner) → error
- RBAC: non-OWNER cannot change roles
- Role change timestamp: audit log updated

**Group 4: Remove Member** (1 spec, 8 tests)
- Click remove button → confirm dialog
- Confirm → DELETE /api/tenants/:id/members/:memberId → member removed
- Cannot remove OWNER (if only 1) → error
- After removal: member no longer in table
- Audit log: removal recorded
- Viewer role: no remove button

**Group 5: Permission Gates + usePermission** (1 spec, 10 tests)
- `<PermissionGate action="MEMBER_INVITE">` → only renders if permission granted
- Permission gate with multiple actions: AND logic
- Permission gate: RBAC value from store
- Dynamic permission check: store updated → gate re-evaluates
- usePermission hook: returns boolean for action
- Tier limits: STARTER allows invites; FREE does not

**Group 6: Roles Reference** (1 spec, 8 tests)
- Roles reference cards: show all roles (OWNER, ADMIN, EDITOR, VIEWER, etc.)
- Each card: name, description, key permissions (read-only)
- Collapse/expand details per role
- i18n: role names in EN/ES
- Copy role description to clipboard

**Group 7: Free Tier Banner** (1 spec, 6 tests)
- FREE tier: show "Upgrade to invite team members" banner
- STARTER+: banner not visible
- Banner CTA: click → upgrade modal
- Banner dismissible: remember dismiss state (localStorage)
- Reinvite removed member: FREE tier → error; STARTER+ → allowed

#### Key Challenges

1. **Rewriting team specs without mocks**: Similar to organization. Must use real API, real permissions, real DB state.
2. **Invitation flow**: Email sending must work (can mock email service but not API route).
3. **Permission evaluation in dynamic contexts**: Store → component → permission gate.

#### Infrastructure Needed

- ⚠️ Rewrite `team.helper.ts` (currently uses mocks) with real API
- ⚠️ Add DB helper: `createInvitationForMember(tenantId, email)` — pre-create pending invite
- ⚠️ Add DB helper: `updateMemberRole(tenantId, memberId, role)` — manually set role for test setup
- ✅ Page and service mostly exist

#### Estimated Effort

- **40 hours total**
  - Rewriting team specs without mocks: 18h
  - Permission gate + hook tests: 10h
  - Role reference tests: 5h
  - Stabilization: 7h

#### Exit Criteria

- ✅ All team specs rewritten without `page.route()` mocks
- ✅ Members CRUD operations tested with real BE
- ✅ RBAC permission gates evaluated correctly
- ✅ Invitation flow validated end-to-end
- ✅ Free tier member limit enforced

---

### 🎯 Phase 5: Edge Cases, Error States, RBAC Combinations (Weeks 4.5–5.5)

**Objective**: Reach 100% coverage by adding specs for edge cases, error states, and RBAC permission matrix.

#### Coverage Gaps by Area

**Auth**:
- OAuth cancellation (user denies in popup)
- Token expiration during form submit
- Simultaneous requests during token refresh
- 3+ wrong password attempts (rate limit)

**Onboarding**:
- Network error during tenant creation
- Form validation edge cases (max lengths, special chars)
- Cancellation during step 2 → keep state when re-enter

**Organization**:
- Profile update conflict (concurrent edits)
- Audit log 500 error → error message
- Suspension status change during user session → forced logout
- Logo upload: file too large, wrong format

**Team**:
- Invite expired: resend generates new token
- 2^N RBAC permission combinations (8 basic roles × N actions = matrix)
- Remove self as member → redirect to login
- Transfer ownership to non-member

**Storages** (already ~88%, fill remaining gaps):
- Storage quota exceeded: create 4th when tier=FREE → error modal
- Archive then delete: archive first → then delete
- Restore archived storage
- Edit storage then switch storage → changes lost (confirmation)

**Shared**:
- Dark mode: media query change while app running → auto-update
- Language: change then reload → language persists
- Multiple windows: locale change in one → other reflects it
- Accessibility: keyboard navigation, ARIA labels, screen reader

#### Specs to Create (High-Level Buckets)

**Group 1: RBAC Permission Matrix** (3 specs, 24 tests)
- Test all role → action combinations:
  - OWNER: all actions ✅
  - ADMIN: all except transfer ownership, delete org
  - EDITOR: STORAGE_*, PROFILE_READ
  - VIEWER: *_READ only
  - etc.
- Each combination: verify button enabled/disabled, API attempt → 403 if unauthorized
- Test cascading permissions (OWNER > ADMIN > EDITOR > VIEWER)

**Group 2: Concurrent Operations** (2 specs, 12 tests)
- Two browser tabs: both edit profile → last write wins (show conflict message)
- Two tabs: one invites member → other refreshes → new member visible
- Simultaneous token refresh in 2 tabs → no 401 loops
- Upload file + navigate away → upload completes (or shows warning)

**Group 3: Error Scenarios by Module** (3 specs, 18 tests)
- 500 errors: profile load, member list, storages list → show error message, retry button
- 503 service unavailable → show service-down banner, auto-retry
- Network timeout (>30s) → error message, offline indicator
- 401 refresh failure → force logout, redirect to login
- 413 payload too large (file upload) → show file size error

**Group 4: State Transitions** (2 specs, 14 tests)
- User logged out in another tab → this tab redirects to login
- Organization suspended → force logout + show suspension notice
- Tier downgrade mid-session: lose permission → UI updates, feature disabled
- Member removed from org → forced logout, redirect to login

**Group 5: i18n Edge Cases** (1 spec, 8 tests)
- Unsupported language code → fallback to EN
- Language-specific date/time formatting
- RTL language (if added): UI layout, text direction
- Missing translation keys → show key (dev) or fallback (prod)

**Group 6: Accessibility** (1 spec, 12 tests)
- Keyboard navigation: Tab through all interactive elements
- ARIA labels: buttons, modals, inputs have labels
- Focus management: modal opens → focus trapped, closes → focus returns
- Screen reader testing (if NVDA/JAWS available; else manual checks)

**Group 7: Mobile/Responsive** (1 spec, 10 tests)
- Mobile (375w): storage switcher collapses to dropdown
- Tablet (768w): sidebar responsive
- Desktop (1440w): full layout
- Touch: tap interactive elements, no hover states
- Orientation change: portrait → landscape → layout adapts

**Group 8: Storage-Specific Edge Cases** (2 specs, 16 tests)
- Create storage with max-length name (255 chars)
- Edit storage: change type WAREHOUSE → STORE_ROOM → confirm modal
- Archive then restore: data intact
- Delete archived storage → cannot restore
- Archive all storages → empty state message
- Pagination: create 50 storages → paginate correctly
- Filter by type: WAREHOUSE, STORE_ROOM, VEHICLE, etc.
- Filter by status: ACTIVE, ARCHIVED

#### Estimated Effort

- **55 hours total**
  - RBAC matrix tests: 15h (many combinations, need parametrized tests)
  - Error scenario tests: 12h (mocking BE error responses via real 500s)
  - State transition tests: 10h (complex multi-step, timing)
  - Accessibility + responsive: 10h (manual checks, validation)
  - Stabilization + flakiness fixes: 8h

#### Exit Criteria

- ✅ 100% coverage across all modules (statements/branches/functions/lines)
- ✅ All RBAC permission combinations tested
- ✅ Error scenarios covered (no "fixme" placeholders remaining)
- ✅ Edge cases: concurrent ops, state transitions, i18n, accessibility
- ✅ All specs pass consistently (zero flakiness)

---

## fixme Budget & Justification

A **fixme** test is acceptable **ONLY** when the condition cannot be reproduced without mocks, and mocking would violate the no-mocks constraint. List below:

| Scenario | Why fixme is OK | Alternative Considered |
|---|---|---|
| 500 error during slow network | Can be tested by real 500 from BE (no mock needed) | Not a fixme — test the real error |
| Simulating packet loss / corruption | Would need network mock (violates constraint) | Accept as fixme; not critical for SPA |
| Browser extension interference | Environment-specific, not reproducible in CI | Not in scope; document as known issue |
| Timezone-dependent behavior | Test with UTC; use fixed dates in tests | Not a fixme; use test utilities |
| Expired session cookie (7 days) | Can be tested by manipulating cookie expiry via script | Not a fixme; use `page.context().cookies()` |
| Memory leak in long-running session | Requires heap snapshots; not in Playwright scope | Out of scope; use separate profiling test suite |

**Current estimate: ~2–3 fixme tests max across entire suite** (vs. 18 today in storage specs). Goal: eliminate all fixme by using real BE error responses.

---

## Infrastructure & Tooling

### Fixtures

| Fixture | Purpose | Status |
|---|---|---|
| `coverage.fixture.ts` | Collects Istanbul coverage data | ✅ Exists |
| `auth.fixture.ts` | Pre-auth page (logged in) | ✅ Exists |
| `onboarding.fixture.ts` | Post-onboarding page | ✅ Exists |
| `organization.fixture.ts` | Add: pre-populated org settings | ⚠️ Create |
| `team.fixture.ts` | Add: pre-populated team + members | ⚠️ Create |

### Helpers

| Helper | Purpose | Status |
|---|---|---|
| `api.helper.ts` | HTTP calls to backend | ✅ Exists; extend with OAuth, password reset |
| `db.helper.ts` | DB state setup (verify email, set tier, etc.) | ✅ Exists; extend with audit log, permission seeding |
| `auth.helper.ts` | Auth-specific setup | ✅ Exists |
| `storage.helper.ts` | Storage creation, quota setup | ✅ Exists (`real-storage.helper.ts`) |
| `organization.helper.ts` | Rewrite: remove mocks, use real API | ⚠️ Rewrite |
| `team.helper.ts` | Rewrite: remove mocks, use real API | ⚠️ Rewrite |
| `onboarding.helper.ts` | Onboarding setup + navigation | ⚠️ Create |

### Page Objects

| Page Object | Status |
|---|---|
| `auth.page.ts` | ✅ Exists |
| `authentication-*.page.ts` | ✅ Exist (login, register, verify-email, etc.) |
| `storages-list.page.ts` | ✅ Exists |
| `create-storage-drawer.page.ts` | ✅ Exists |
| `organization-settings.page.ts` | ✅ Exists |
| `team-settings.page.ts` | ✅ Exists |
| `dashboard.page.ts` | ⚠️ Add if needed |

### Configuration

| File | Notes |
|---|---|
| `playwright.config.ts` | Set `PW_API_URL=http://localhost:3001/api` |
| `.env.e2e` | API URL, DB credentials, E2E_MODE flag |
| `vitest.config.ts` | Coverage thresholds: 100% for FE unit tests |
| `vite.config.ts` | Coverage instrumenter: `istanbul` |

---

## Dependencies & Sequencing

```
Phase 1 (Auth)
    ↓
Phase 2 (Shared Infrastructure)
    ↓
Phase 3 (Onboarding + Organization)  ←┐
    ↓                                   ├─ Parallel possible
Phase 4 (Team)                         ←┤
    ↓                                   ├─ After Phase 2
Phase 5 (Edge Cases + Matrix)          ←┘
```

**Why sequential**:
1. Auth must work first — everything depends on login.
2. Shared infrastructure (stores, hooks) needed by all features.
3. Onboarding must be tested before org/team (they depend on tenant setup).
4. Org + Team can run in parallel (independent features).
5. Edge cases last (require full system working).

---

## Success Metrics

| Metric | Success Criteria | Measurement |
|---|---|---|
| **Coverage %** | 100% statements/branches/functions/lines | `npm run test:e2e -- --coverage` → `nyc` report |
| **Spec Count** | ~80–90 total specs across all modules | `find e2e/specs -name "*.spec.ts" \| wc -l` |
| **No Mocks** | 0 active `page.route()` calls (except test utilities) | `grep -r "page.route\|page.intercept" e2e/specs` → no matches |
| **Flakiness** | <1% test failure rate over 10 runs | Run suite 10×, calculate P(failure) |
| **Execution Time** | <45 min for full suite (serial) | Time `npm run test:e2e` |
| **fixme Count** | ≤3 across entire suite | `grep -r "fixme\|skip\|xdescribe" e2e/specs` → ≤3 |

---

## Risk Mitigation

| Risk | Impact | Mitigation |
|---|---|---|
| **Rate limiting blocks tests** | Tests hang, timeout | Restart E2E backend to clear rate limit counters; use `E2E_MODE=true` if available |
| **DB state conflicts** (tests interfere) | Flaky tests, false negatives | Use unique user emails per test: `${testName}_${Date.now()}@stocka.test` |
| **Email delivery delay** | Verification code not received | Mock email service at API level (don't call real Resend); OR poll DB for code |
| **OAuth popup doesn't open** | Test hangs | Use `page.waitForPopup()` with timeout; add retry logic |
| **Token refresh loop** | Infinite 401 → 401 cycle | Test token refresh in isolation first (Phase 1); ensure BE refresh endpoint works |
| **Concurrent operations race** | Flaky assertions | Use explicit waits: `page.waitForURL()`, `page.waitForFunction()`, never just `await page.goto()` |
| **Multi-tab communication** | Tests fail intermittently | Use `context.pages()` to access all tabs; sync state via manual click/wait, not SharedWorker |

---

## Rollout Timeline

| Week | Phase | Tasks | Team |
|---|---|---|---|
| **Week 1** | Phase 1 | Auth module specs (Groups 1–5) | 1 QA Engineer |
| **Week 1.5** | Phase 2 | Shared infrastructure (stores, hooks, components) | 1 QA Engineer |
| **Week 2** | Phase 2 cont. | Axios interceptors, theme, i18n tests | 1 QA Engineer |
| **Week 2.5** | Phase 3 | Organization specs rewrite (no mocks) | 1 QA Engineer + dev support |
| **Week 3** | Phase 3 cont. | Onboarding specs | 1 QA Engineer |
| **Week 3.5** | Phase 4 | Team specs rewrite (no mocks) | 1 QA Engineer |
| **Week 4** | Phase 4 cont. | Role matrix, permission gates | 1 QA Engineer |
| **Week 4.5** | Phase 5 | Edge cases, error scenarios, state transitions | 1 QA Engineer |
| **Week 5** | Phase 5 cont. | i18n, accessibility, responsive, stabilization | 1 QA Engineer |
| **Week 5.5** | Cleanup | Fix flakiness, final coverage report, docs | 1 QA Engineer |

**Total**: 5.5 weeks @ 40 hours/week = ~220 hours effort (aligns with estimate).

---

## Definition of Done: E2E Coverage 100%

A task is complete when:

- [ ] All specs in the phase pass 100% consistently (0 flakiness over 3 runs)
- [ ] Coverage thresholds met (100% statements/branches/functions/lines for affected modules)
- [ ] **Zero active `page.route()` mocks** in target specs (real API calls only)
- [ ] All tests use real backend on port 3001
- [ ] fixme budget adhered to (<1% of total tests)
- [ ] PR includes:
  - New E2E specs (organized by module)
  - Updated helpers + DB utilities
  - Updated page objects as needed
  - Coverage report screenshot (showing 100%)
- [ ] All existing tests still pass (no regressions)

---

## Appendix: Quick Reference

### Command Reference

```bash
# Run all E2E tests
npm run test:e2e

# Run specific suite
npm run test:e2e -- --grep "Given.*organization owner"

# Generate coverage report
COVERAGE=true npm run test:e2e
npm run test:e2e:report

# Watch mode (Playwright Inspector)
npm run test:e2e -- --debug

# Headed mode (see browser)
npm run test:e2e -- --headed

# Single worker (no parallelism, easier debugging)
npm run test:e2e -- --workers=1
```

### DB Helper Pattern

```typescript
// In test setup
const pool = createDbPool();
await apiSignUp({ email, username, password });
await verifyUserEmail(pool, email);  // ← Use real BE verification, not manual DB update
await setTierByUserUuid(pool, userId, 'STARTER');
await clearAllStoragesForUser(pool, userId);

// After test
await pool.end();
```

### No-Mocks Pattern

```typescript
// ❌ OLD (with mocks)
await page.route(/\/api\/tenants\/me\/profile$/, async (route) => {
  await route.fulfill({
    status: 200,
    body: JSON.stringify({ success: true, data: MOCK_PROFILE }),
  });
});

// ✅ NEW (real BE)
// Setup via API helper:
const signUp = await apiSignUp({ email, username, password });
await verifyUserEmail(pool, email);
await apiCompleteOnboarding(signUp.accessToken);

// Test just navigates and makes real requests:
await page.goto('/settings/organization');
// GET /api/tenants/me/profile → real BE returns real tenant
```

---

## Document Revision

| Version | Date | Author | Changes |
|---|---|---|---|
| 1.0 | 2026-04-16 | Project Manager | Initial plan: 5 phases, 220h effort, 100% coverage target |

