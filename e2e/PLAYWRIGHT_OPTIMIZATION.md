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


     Plan: Optimizar tiempos de E2E tests con Playwright

     Context

     Los tests E2E de Playwright tardan ~35-40 min por 3 causas identificadas:
     1. Rate limiting del backend: sign-up hits el límite progresivo (5 → 10min block, 8 → 60min block). fetchWithRetry espera el Retry-After header completo → fixtures timeout a los 60s.
     2. UI sign-in per test: authenticatedPage hace un browser sign-in completo (form fill + click + waitForURL) para CADA test que lo usa.
     3. retries: 1 localmente: cada test fallido corre 2 veces. 25 failures × 60s × 2 = ~50min solo en retries.

     Archivos clave:
     - playwright.config.ts — config general
     - e2e/global-setup.ts — trunca DB, no crea usuarios
     - e2e/helpers/api.helper.ts — fetchWithRetry espera Retry-After (hasta 60min)
     - e2e/fixtures/auth.fixture.ts — verifiedUser (worker-scoped) + authenticatedPage
     - e2e/fixtures/onboarding.fixture.ts — verifiedUser onboarding (worker-scoped)
     - e2e/specs/storage/storage-rbac.spec.ts — setupAndSignIn hace UI sign-in completo

     ---
     Estrategias (ordenadas por impacto/esfuerzo)

     S1 — Quick wins en playwright.config.ts (5 min, ahorra ~25 min)

     retries: 0 localmente
     retries: process.env.CI ? 1 : 0,
     25 failures × 60s × 1 retry eliminados = ~25min.

     timeout: 15_000 por defecto
     timeout: 15_000,  // era 60_000
     Failures fallan en 15s en lugar de 60s. Tests que necesiten más tiempo hacen test.setTimeout(60_000) inline.

     ---
     S2 — fetchWithRetry: fail-fast en Retry-After largo (10 min)

     En e2e/helpers/api.helper.ts, si delaySeconds > 30, lanzar error inmediatamente en lugar de esperar:
     if (delaySeconds > 30) {
       throw new Error(`[api.helper] Rate limited — Retry-After: ${delaySeconds}s. Reinicia el backend para limpiar los contadores.`);
     }
     Transforma el timeout silencioso de 60s en un error descriptivo en <1s.

     ---
     S3 — Pre-seed usuarios en globalSetup + storageState (40 min, elimina rate limiting en fixtures)

     En e2e/global-setup.ts — después de truncar, crear:
     1. verifiedUser (con tenant) via apiSignUp + verifyUserEmail + apiCompleteOnboarding
     2. viewerUser (para el test 403 de storage-rbac) via apiSignUp + verifyUserEmail
     3. Lanzar Chromium headless, sign in como verifiedUser, guardar storageState a e2e/.auth/user.json
     4. Guardar credenciales en e2e/.auth/users.json

     // e2e/global-setup.ts (nuevo bloque después de truncateAll)
     const { userId, accessToken } = await apiSignUp({ email, username, password });
     await verifyUserEmail(pool, email);
     await apiCompleteOnboarding(accessToken);

     const { userId: viewerUserId } = await apiSignUp({ email: viewerEmail, ... });
     await verifyUserEmail(pool, viewerEmail);

     // Guardar creds
     writeFileSync('e2e/.auth/users.json', JSON.stringify({ verifiedUser, viewerUser }));

     // Guardar storageState
     const browser = await chromium.launch();
     const ctx = await browser.newContext({ baseURL });
     const page = await ctx.newPage();
     await page.goto('/authentication/sign-in');
     // sign in via UI
     await ctx.storageState({ path: 'e2e/.auth/user.json' });
     await browser.close();

     En e2e/fixtures/auth.fixture.ts — cargar desde archivo en lugar de API:
     verifiedUser: [
       async ({}, use) => {
         const { verifiedUser } = JSON.parse(readFileSync('e2e/.auth/users.json', 'utf-8'));
         await use(verifiedUser);  // cero llamadas API
       },
       { scope: 'worker' },
     ],

     authenticatedPage: async ({ browser }, use) => {
       const ctx = await browser.newContext({ storageState: 'e2e/.auth/user.json' });
       const page = await ctx.newPage();
       await page.goto('/dashboard');
       await page.waitForURL('**/dashboard');
       await use(page);
       await ctx.close();
     },

     En e2e/specs/storage/storage-rbac.spec.ts — setupAndSignIn carga storageState:
     async function setupAndSignIn(page, _verifiedUser, rbac) {
       // set up route mocks (igual que antes)
       await page.route('**/rbac/my-permissions', route => { ... });
       await page.route(/\/api\/storages$/, route => { ... });
       // cargar auth state en el contexto actual y navegar directo
       await page.context().addInitScript(() => {}); // fuerza hydration
       await page.goto('/storages');
       await page.waitForURL('**/storages');
     }
     Para esto el page ya debe tener storageState. Necesita un nuevo fixture authenticatedRbacPage que cargue storageState y sea usado en lugar de page en storage-rbac.

     Alternativa más simple: que los tests de storage-rbac usen authenticatedPage de auth.fixture.ts + navigate to /storages en lugar de setupAndSignIn. Las mocks se registran ANTES de navegar a /storages (no antes de sign-in). Esto funciona porque sign-in ya ocurrió en el fixture.

     En e2e/fixtures/onboarding.fixture.ts — los usuarios de onboarding SIGUEN creándose via API (son 2 calls totales con workers: 1, ambas bajo el threshold de 5):
     - Con verifiedUser + viewerUser pre-seeded en globalSetup (2 calls), el conteo de sign-ups de runtime = 2 (onboarding fixtures) + 5 (sign-up spec) = 7
     - Esto aún puede chocar con el threshold de 5 → 10min block

     Mejor solución para onboarding: también pre-seed 2 usuarios onboarding en globalSetup:
     - onboardingUserA y onboardingUserB (sin tenant cada uno)
     - Guardar ambos en users.json
     - La fixture del onboarding usa un counter atómico en archivo para asignar un usuario único por worker

     // e2e/fixtures/onboarding.fixture.ts
     verifiedUser: [
       async ({}, use) => {
         const users = JSON.parse(readFileSync('e2e/.auth/users.json', 'utf-8'));
         // Counter file: atomically pick next onboarding user
         const counterPath = 'e2e/.auth/onboarding-counter.json';
         let idx = 0;
         try { idx = JSON.parse(readFileSync(counterPath, 'utf-8')).idx; } catch {}
         writeFileSync(counterPath, JSON.stringify({ idx: idx + 1 }));
         const user = users.onboardingUsers[idx % users.onboardingUsers.length];
         await use(user);
       },
       { scope: 'worker' },
     ],

     Con este enfoque, globalSetup hace 4 sign-up calls (verifiedUser + viewerUser + onboardingUserA + onboardingUserB). Los sign-up spec tests hacen 5 calls. Total = 9 → sigue tocando el rate limit.

     ---
     S4 — Solución definitiva al rate limiting: config backend (10 min, backend change)

     En stocka-server, subir el threshold de sign-up para el entorno de test:

     // authentication.controller.ts o sign-up rate limiter config
     const SIGN_UP_RATE_LIMIT = {
       maxAttemptsByIp: process.env.E2E_MODE === 'true' ? 1000 : 10,
       progressive: process.env.E2E_MODE === 'true' ? [] : [
         { attempts: 5, blockMinutes: 10 },
         { attempts: 8, blockMinutes: 60 },
       ],
     };

     El E2E backend arranca con E2E_MODE=true DB_DATABASE=stocka_playwright PORT=3002 npm run start:dev.

     Esto elimina completamente el rate limiting como factor. Sin este cambio, S3 sigue siendo incompleto.

     ---
     S5 — workers: 2 para paralelismo (20 min, requiere S3+S4)

     Con usuarios pre-seeded (no hay sign-up calls en runtime desde fixtures):

     // playwright.config.ts
     workers: process.env.CI ? 1 : 2,
     fullyParallel: false,  // tests dentro de un spec siguen siendo seriales

     2 spec files corren en paralelo. Reduce tiempo total ~50%.

     Requiere que los onboardingUsers[0] y onboardingUsers[1] sean usuarios distintos asignados por workerIndex (el counter approach de S3 funciona para workers: 2 también).

     ---
     Impacto esperado

     ┌──────────────────────────────────┬─────────────────┐
     │            Estrategia            │ Tiempo estimado │
     ├──────────────────────────────────┼─────────────────┤
     │ Baseline actual                  │ ~35-40 min      │
     ├──────────────────────────────────┼─────────────────┤
     │ + S1 (retries + timeout)         │ ~10-15 min      │
     ├──────────────────────────────────┼─────────────────┤
     │ + S2 (fail-fast rate limit)      │ ~8-10 min       │
     ├──────────────────────────────────┼─────────────────┤
     │ + S3 + S4 (pre-seed + BE config) │ ~5-7 min        │
     ├──────────────────────────────────┼─────────────────┤
     │ + S5 (workers: 2)                │ ~3-4 min        │
     └──────────────────────────────────┴─────────────────┘

     ---
     Archivos a modificar

     ┌────────────────────────────────────────┬──────────────────────────────────────────────┐
     │                Archivo                 │                    Cambio                    │
     ├────────────────────────────────────────┼──────────────────────────────────────────────┤
     │ playwright.config.ts                   │ retries, timeout, workers                    │
     ├────────────────────────────────────────┼──────────────────────────────────────────────┤
     │ e2e/global-setup.ts                    │ pre-seed usuarios + storageState             │
     ├────────────────────────────────────────┼──────────────────────────────────────────────┤
     │ e2e/helpers/api.helper.ts              │ fail-fast en Retry-After largo               │
     ├────────────────────────────────────────┼──────────────────────────────────────────────┤
     │ e2e/fixtures/auth.fixture.ts           │ cargar desde .auth/users.json + storageState │
     ├────────────────────────────────────────┼──────────────────────────────────────────────┤
     │ e2e/fixtures/onboarding.fixture.ts     │ cargar desde .auth/users.json + counter      │
     ├────────────────────────────────────────┼──────────────────────────────────────────────┤
     │ e2e/specs/storage/storage-rbac.spec.ts │ setupAndSignIn → storageState-based          │
     ├────────────────────────────────────────┼──────────────────────────────────────────────┤
     │ stocka-server (sign-up rate limiter)   │ E2E_MODE=true → sin rate limit               │
     ├────────────────────────────────────────┼──────────────────────────────────────────────┤
     │ .gitignore                             │ agregar e2e/.auth/*.json                     │
     └────────────────────────────────────────┴──────────────────────────────────────────────┘

     Verificación

     # Backend E2E con E2E_MODE
     E2E_MODE=true DB_DATABASE=stocka_playwright PORT=3002 npm run start:dev

     # Run completo
     cd stocka-client && npm run test:e2e

     # Target: ≤ 5 min, 0 failed, todos los specs pasan