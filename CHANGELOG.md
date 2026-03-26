# Stocka Client — Changelog

All notable changes to this project are documented here.


## [0.11.5](https://github.com/stocka-app/stocka-client/compare/v0.11.4...v0.11.5) (2026-03-26)

### 🐛 Bug Fixes

* **dashboard:** replace Card wrapper with flat divider layout pattern ([d187410](https://github.com/stocka-app/stocka-client/commit/d1874100da1db31629644d6c0eb964380c0bbccc))

## [0.11.4](https://github.com/stocka-app/stocka-client/compare/v0.11.3...v0.11.4) (2026-03-26)

### 🐛 Bug Fixes

* **ui:** [dark-mode] increase surface-raised contrast and fix shadow-sm ([338618b](https://github.com/stocka-app/stocka-client/commit/338618b015e6c04598c9004f37bdccbacc5e0844)), closes [#1e2d42](https://github.com/stocka-app/stocka-client/issues/1e2d42) [#182437](https://github.com/stocka-app/stocka-client/issues/182437) [#1f3352](https://github.com/stocka-app/stocka-client/issues/1f3352)

## [0.11.3](https://github.com/stocka-app/stocka-client/compare/v0.11.2...v0.11.3) (2026-03-26)

### 🐛 Bug Fixes

* **ui:** [dark-mode] fix inverted neutral scale misuse across app shell ([7c00c4a](https://github.com/stocka-app/stocka-client/commit/7c00c4a15fefb2ed947c522c06dc306a2b266ec9)), closes [#f8fafc](https://github.com/stocka-app/stocka-client/issues/f8fafc) [#e2e8f0](https://github.com/stocka-app/stocka-client/issues/e2e8f0) [#0b1221](https://github.com/stocka-app/stocka-client/issues/0b1221) [#182437](https://github.com/stocka-app/stocka-client/issues/182437) [#273d5c](https://github.com/stocka-app/stocka-client/issues/273d5c)

## [0.11.2](https://github.com/stocka-app/stocka-client/compare/v0.11.1...v0.11.2) (2026-03-25)

### 🐛 Bug Fixes

* **ui:** fix avatar 429 error, ThemeToggle FOUT, and silent getMe failure ([cd22494](https://github.com/stocka-app/stocka-client/commit/cd224944cf4501b5c5e9392fb0eaba79c26ca0db))

## [0.11.1](https://github.com/stocka-app/stocka-client/compare/v0.11.0...v0.11.1) (2026-03-25)

### 🎨 Styles

* update dark mode styles for improved contrast and readability ([bec2039](https://github.com/stocka-app/stocka-client/commit/bec203945856b945d6c86203937cda9eb8701809))

## [0.11.0](https://github.com/stocka-app/stocka-client/compare/v0.10.0...v0.11.0) (2026-03-24)

### ✨ Features

* **auth:** [Sprint 1] show OAuth avatar and smart initials in sidebar ([38281f8](https://github.com/stocka-app/stocka-client/commit/38281f8683a76e1fa7e938599a608e5d81bd008c))

## [0.10.0](https://github.com/stocka-app/stocka-client/compare/v0.9.0...v0.10.0) (2026-03-24)

### ✨ Features

* **auth:** [Sprint 1] add displayName to JWT payload and user avatar initials ([c6e9272](https://github.com/stocka-app/stocka-client/commit/c6e927254db8cf619772191fcbb13c54569a3e5b))

## [0.9.0](https://github.com/stocka-app/stocka-client/compare/v0.8.4...v0.9.0) (2026-03-24)

### ✨ Features

* **layout:** [Sprint 1] add hasSubNav chevron indicator to sidebar nav items ([0b7b83e](https://github.com/stocka-app/stocka-client/commit/0b7b83eaaeeb502de67eec9575e5b4515d06d0da))

### 🐛 Bug Fixes

* **onboarding:** [Sprint 1] fix token rotation and auth store update after onboarding completion ([8d9e0bf](https://github.com/stocka-app/stocka-client/commit/8d9e0bffcb7e20bc5984bf6668feec384e46fc91))

### 🔧 Refactoring

* **shared:** [Sprint 1] redesign LanguageSwitcher to Globe icon trigger and fix tests ([9f83aa3](https://github.com/stocka-app/stocka-client/commit/9f83aa390c0c6379b563734155acff77f0f26c4c))

### ✅ Tests

* **rbac:** [Sprint 1] extend RBAC store and usePermission coverage ([d3f37da](https://github.com/stocka-app/stocka-client/commit/d3f37da757227f71825c3d851d4ed8ed228a0649))

## [0.8.4](https://github.com/stocka-app/stocka-client/compare/v0.8.3...v0.8.4) (2026-03-23)

### 🐛 Bug Fixes

* **auth:** fix OAuth popup flow and rename auth routes ([a0380bf](https://github.com/stocka-app/stocka-client/commit/a0380bf18fef1549c6841297465e8f0df20b342c))
* **e2e:** update Playwright E2E tests to match current UI and schema architecture ([a55a376](https://github.com/stocka-app/stocka-client/commit/a55a376b5f60daa7e27557d973402b34032ff570))
* **test:** add initReactI18next mock to i18n test helper ([499b5e1](https://github.com/stocka-app/stocka-client/commit/499b5e15881916f37bfd8ace0e5f154b46c34325))

### 🔧 Refactoring

* **auth:** improve authentication components, guards, and store ([a930731](https://github.com/stocka-app/stocka-client/commit/a9307314f0fb7301d94d34adfdfb0e29cabc2d4d))
* **onboarding:** enhance onboarding flow, schemas, and store ([522067e](https://github.com/stocka-app/stocka-client/commit/522067e357005236cbf7675ea8e7b3a24ccd3071))
* **onboarding:** merge step 6 and step 7 into single completion step ([d2c0368](https://github.com/stocka-app/stocka-client/commit/d2c0368992faa50cd3ec834904d07b04a4989efb))
* **org:** update organization, spaces, and team components ([0e6d5fd](https://github.com/stocka-app/stocka-client/commit/0e6d5fdf92bb0cec82871e4ef9ffc8b05e38720b))
* **shared:** update shared components, stores, and infrastructure ([cacbdd7](https://github.com/stocka-app/stocka-client/commit/cacbdd785220b41c2ac3dbfe3422dfeb3a18b6ab))

### 📚 Documentation

* rewrite README in English with improved structure and badges ([c69d94c](https://github.com/stocka-app/stocka-client/commit/c69d94c66b6a7b098d4fe604d7566cc9811faf96))

### ✅ Tests

* **onboarding,privacy:** achieve 100% unit test coverage across all features ([346f42f](https://github.com/stocka-app/stocka-client/commit/346f42f1ba28116ca6784bfc1de012c3266fc468))

## [0.8.3](https://github.com/stocka-app/stocka-client/compare/v0.8.2...v0.8.3) (2026-03-20)

### 🐛 Bug Fixes

* **auth:** [STOC-192](https://austins-industries.atlassian.net/browse/STOC-192) — fix OAuth popup: use BroadcastChannel instead of window.opener ([1e0e32c](https://github.com/stocka-app/stocka-client/commit/1e0e32cb62b0ade11365b5b26d8cdb8d6ca6da50))

## [0.8.2](https://github.com/stocka-app/stocka-client/compare/v0.8.1...v0.8.2) (2026-03-20)

### 🐛 Bug Fixes

* **auth:** [STOC-192](https://austins-industries.atlassian.net/browse/STOC-192) — fix OAuth popup frontend: same-origin postMessage from callback page ([84564b3](https://github.com/stocka-app/stocka-client/commit/84564b3484b1f14daaeb86abdb83f2a202e6db5a))

## [0.8.1](https://github.com/stocka-app/stocka-client/compare/v0.8.0...v0.8.1) (2026-03-19)

### 🐛 Bug Fixes

* **auth:** [STOC-192](https://austins-industries.atlassian.net/browse/STOC-192) — align postMessage type with backend ('oauth-success' lowercase) ([448d52f](https://github.com/stocka-app/stocka-client/commit/448d52f8be8099d174417be539b4004f6bf41dab))

## [0.8.0](https://github.com/stocka-app/stocka-client/compare/v0.7.0...v0.8.0) (2026-03-19)

### ✨ Features

* **auth:** [STOC-263](https://austins-industries.atlassian.net/browse/STOC-263) — remove Facebook OAuth provider ([5ab583b](https://github.com/stocka-app/stocka-client/commit/5ab583bcdba51520f98423ab761eb73658e09f21))
* **auth:** [STOC-263](https://austins-industries.atlassian.net/browse/STOC-263) — upgrade social buttons from icon-only to full-width labeled layout ([f5da3ab](https://github.com/stocka-app/stocka-client/commit/f5da3aba61952b09588e120c2266afb4033b1554))
* **auth:** [STOC-285](https://austins-industries.atlassian.net/browse/STOC-285) — add openOAuthPopup() utility with centered position and fallback ([346a81d](https://github.com/stocka-app/stocka-client/commit/346a81de52bbc28ac0b5c791bdcadd8caacd7de6))
* **auth:** [STOC-286](https://austins-industries.atlassian.net/browse/STOC-286) — add useOAuthPopup hook with window.message listener for popup token ([b950453](https://github.com/stocka-app/stocka-client/commit/b950453f5ac2eb78a90cba90c3870c24465f07f3))
* **auth:** [STOC-287](https://austins-industries.atlassian.net/browse/STOC-287) — update initiateOAuth() to use popup instead of redirect ([1cf9888](https://github.com/stocka-app/stocka-client/commit/1cf9888036533f3ac2c26ebf06925a65c86e6c77))

### 🐛 Bug Fixes

* **e2e:** [STOC-263](https://austins-industries.atlassian.net/browse/STOC-263) — fix e2e test infrastructure for full-width social buttons ([38b732d](https://github.com/stocka-app/stocka-client/commit/38b732d953e94b64e23be878b8b6776f17b4c801))

### ✅ Tests

* **auth:** [STOC-288](https://austins-industries.atlassian.net/browse/STOC-288) — add tests for OAuth popup flow ([ef3893d](https://github.com/stocka-app/stocka-client/commit/ef3893de895af884633b56d122c0c30126af7ba0))

## [0.7.0](https://github.com/stocka-app/stocka-client/compare/v0.6.0...v0.7.0) (2026-03-19)

### ✨ Features

* **organization:** [STOC-263](https://austins-industries.atlassian.net/browse/STOC-263) — add i18n strings and test mock for org settings feature ([52dcc42](https://github.com/stocka-app/stocka-client/commit/52dcc420c8bd68843f0afca24d2c09ce9caa4aa7))
* **organization:** [STOC-263](https://austins-industries.atlassian.net/browse/STOC-263) — add org settings UI components with permission gates ([ec6ec20](https://github.com/stocka-app/stocka-client/commit/ec6ec2058c381f19031f79254e90e9bd15f7da2d))
* **organization:** [STOC-263](https://austins-industries.atlassian.net/browse/STOC-263) — add organization API service with Zod-validated responses ([e099465](https://github.com/stocka-app/stocka-client/commit/e099465f33b319dbf87c48ac941e4522a444c601))
* **organization:** [STOC-263](https://austins-industries.atlassian.net/browse/STOC-263) — add organization Zustand store (no persist — server data) ([ce5bd59](https://github.com/stocka-app/stocka-client/commit/ce5bd59fc460adfff78dc2306f1733e4603b1fdb))
* **organization:** [STOC-263](https://austins-industries.atlassian.net/browse/STOC-263) — add OrganizationSettingsPage (3 tabs) and barrel export ([cb56825](https://github.com/stocka-app/stocka-client/commit/cb5682500f3685587bec6571fe17d5ced3cd40ad))
* **organization:** [STOC-263](https://austins-industries.atlassian.net/browse/STOC-263) — add team feature stubs (usePermission, PermissionGate) ([6c4b2ae](https://github.com/stocka-app/stocka-client/commit/6c4b2aeee5e8a5aaf450d2a7ff08e75b139fbdc6))
* **organization:** [STOC-263](https://austins-industries.atlassian.net/browse/STOC-263) — add useOrganization hook with debounced name check ([f949882](https://github.com/stocka-app/stocka-client/commit/f949882b57d86207fe614567745a813721711f48))
* **organization:** [STOC-263](https://austins-industries.atlassian.net/browse/STOC-263) — add Zod schemas and TypeScript types for org settings ([84f6839](https://github.com/stocka-app/stocka-client/commit/84f6839c91e9282d41b4a957d43d89297b44a659))
* **organization:** [STOC-263](https://austins-industries.atlassian.net/browse/STOC-263) — wire /settings/organization route, i18n namespace, and coverage config ([428fe78](https://github.com/stocka-app/stocka-client/commit/428fe7851335654994525c17a4a476fcc4486cae))
* **spaces:** [STOC-264](https://austins-industries.atlassian.net/browse/STOC-264) — add spaces API service with Zod-validated responses ([492e614](https://github.com/stocka-app/stocka-client/commit/492e614b7358422fec2124ff9b3b1736881cd17a))
* **spaces:** [STOC-264](https://austins-industries.atlassian.net/browse/STOC-264) — add spaces UI components (table, modals, limits) ([2d97b51](https://github.com/stocka-app/stocka-client/commit/2d97b519e9c55e326faf2db48e26602503fddb00))
* **spaces:** [STOC-264](https://austins-industries.atlassian.net/browse/STOC-264) — add useSpaces hook ([2b36dcc](https://github.com/stocka-app/stocka-client/commit/2b36dcc3118f54546fac690cdaf9a4378365b1f2))
* **spaces:** [STOC-264](https://austins-industries.atlassian.net/browse/STOC-264) — add Zod schemas, types, and Zustand store for spaces ([7753859](https://github.com/stocka-app/stocka-client/commit/7753859eb85aaeda896aacef4be497d6f335d712))
* **spaces:** [STOC-264](https://austins-industries.atlassian.net/browse/STOC-264) — wire /warehouse route, spaces i18n namespace, and coverage config ([4823530](https://github.com/stocka-app/stocka-client/commit/48235301b744288ebeb1dcc737b96ad4d3126b52))
* **upgrade-modal:** [STOC-280](https://austins-industries.atlassian.net/browse/STOC-280) — add TierGate and UpgradeModal components ([986d5e2](https://github.com/stocka-app/stocka-client/commit/986d5e2c9d30d38cf51c729c1589206f1bc6d689))
* **upgrade-modal:** [STOC-280](https://austins-industries.atlassian.net/browse/STOC-280) — add upgrade-modal store and useTierGate hook ([8c1ed7c](https://github.com/stocka-app/stocka-client/commit/8c1ed7c545cbe3296087d4df9bcef9b7316534b8))

## [0.6.0](https://github.com/stocka-app/stocka-client/compare/v0.5.0...v0.6.0) (2026-03-19)

### ✨ Features

* **team:** [STOC-262](https://austins-industries.atlassian.net/browse/STOC-262) — add all team management UI components with permission gates ([8e67c9c](https://github.com/stocka-app/stocka-client/commit/8e67c9cd70f5d842bb108b90c07c4efee4e03a60))
* **team:** [STOC-262](https://austins-industries.atlassian.net/browse/STOC-262) — add global RBAC Zustand store with permission evaluation cascade ([0368714](https://github.com/stocka-app/stocka-client/commit/03687148519962bdac571c30acfad5d72231b5d2))
* **team:** [STOC-262](https://austins-industries.atlassian.net/browse/STOC-262) — add i18n strings and test mock for team/RBAC feature ([2245253](https://github.com/stocka-app/stocka-client/commit/22452538a1254ca008d4a873f6918259df0cdf2e))
* **team:** [STOC-262](https://austins-industries.atlassian.net/browse/STOC-262) — add team API service with Zod-validated responses ([7ca194c](https://github.com/stocka-app/stocka-client/commit/7ca194c908b4ad9434fc51f6e3fec1a58ae64c63))
* **team:** [STOC-262](https://austins-industries.atlassian.net/browse/STOC-262) — add TeamSettingsPage (3 tabs) and barrel export ([6cb7121](https://github.com/stocka-app/stocka-client/commit/6cb7121c5f2c6e3d0da0902a15c6bf89a2c9e61d))
* **team:** [STOC-262](https://austins-industries.atlassian.net/browse/STOC-262) — add useTeam hook and usePermission hook with full test coverage ([189acc5](https://github.com/stocka-app/stocka-client/commit/189acc525e599d12458895ca11518cbc0aed0428))
* **team:** [STOC-262](https://austins-industries.atlassian.net/browse/STOC-262) — add Zod schemas and TypeScript types for team management ([1ef6bbf](https://github.com/stocka-app/stocka-client/commit/1ef6bbf8aa93421243c99c46a8659a370be9dc74))
* **team:** [STOC-262](https://austins-industries.atlassian.net/browse/STOC-262) — wire /settings/team route, team i18n namespace, and coverage config ([581b9ef](https://github.com/stocka-app/stocka-client/commit/581b9ef0bb503af1d17614dba53b0c87bb3ea139))

## [0.5.0](https://github.com/stocka-app/stocka-client/compare/v0.4.0...v0.5.0) (2026-03-19)

### ✨ Features

* **onboarding:** [STOC-261](https://austins-industries.atlassian.net/browse/STOC-261) — add all 7-step wizard components + invitation sub-flow ([822c139](https://github.com/stocka-app/stocka-client/commit/822c1397c3fe12c49afc4a07d711bba5f4dd05fa))
* **onboarding:** [STOC-261](https://austins-industries.atlassian.net/browse/STOC-261) — add i18n strings and test mock for onboarding wizard ([54b2547](https://github.com/stocka-app/stocka-client/commit/54b254744b1b2b1eae9c7ac5d4c2601253fe7834))
* **onboarding:** [STOC-261](https://austins-industries.atlassian.net/browse/STOC-261) — add onboarding API service with Zod-validated responses ([f7c3759](https://github.com/stocka-app/stocka-client/commit/f7c3759ecf7b54729574ffc38cb71b46d7850e00))
* **onboarding:** [STOC-261](https://austins-industries.atlassian.net/browse/STOC-261) — add OnboardingPage, OnboardingGuard, and barrel export ([40d5e46](https://github.com/stocka-app/stocka-client/commit/40d5e46b40298a6b13bb0dae98f658429186a526))
* **onboarding:** [STOC-261](https://austins-industries.atlassian.net/browse/STOC-261) — add useOnboarding hook orchestrating store and API calls ([955f03e](https://github.com/stocka-app/stocka-client/commit/955f03e8d7d5a348f666a9db560ca6f704506c51))
* **onboarding:** [STOC-261](https://austins-industries.atlassian.net/browse/STOC-261) — add Zod schemas and TypeScript types for onboarding wizard ([e2ded38](https://github.com/stocka-app/stocka-client/commit/e2ded382c1c15e44a2c5a61b3eadbe29ae1e657f))
* **onboarding:** [STOC-261](https://austins-industries.atlassian.net/browse/STOC-261) — add Zustand store with localStorage persistence for wizard state ([9703a70](https://github.com/stocka-app/stocka-client/commit/9703a703dc7b453752a3ea5572fea70b1cffcf59))
* **onboarding:** [STOC-261](https://austins-industries.atlassian.net/browse/STOC-261) — wire onboarding route, i18n namespace, and coverage config ([50bff2e](https://github.com/stocka-app/stocka-client/commit/50bff2e1137aaec9d49bd45d51694eecf0750997))

## [0.4.0](https://github.com/stocka-app/stocka-client/compare/v0.3.0...v0.4.0) (2026-03-19)

### ✨ Features

* **layout:** [STOC-255](https://austins-industries.atlassian.net/browse/STOC-255) — implement AppLayout shell with collapsible sidebar and route nesting ([a56dfad](https://github.com/stocka-app/stocka-client/commit/a56dfad70c1fe368165164c0c1f38e07e1c4bcba))

## [0.3.0](https://github.com/stocka-app/stocka-client/compare/v0.2.0...v0.3.0) (2026-03-18)

### ✨ Features

* **e2e:** [STOC-281](https://austins-industries.atlassian.net/browse/STOC-281) — setup Playwright e2e framework for stocka-client ([7f2c158](https://github.com/stocka-app/stocka-client/commit/7f2c15818ff29bcb2d30e646e8a14b8c8d249c11))

### 📚 Documentation

* **changelog:** [skip ci] | Sprint 1 | add semantic context blockquotes to v0.1.0 and v0.2.0 releases ([8dd28a7](https://github.com/stocka-app/stocka-client/commit/8dd28a73f7ba233e7a557438b0b8c00d01754197))

## [0.2.0](https://github.com/stocka-app/stocka-client/compare/v0.1.0...v0.2.0) (2026-03-18)

> **📝 Nota:** Release de mantenimiento menor. Bootstrapping del sistema de changelog local — configuración de `release-it` con `.release-it.cjs` (necesario por `"type": "module"` en package.json) + hooks `post-merge`/`post-commit` para generación automática en main. A partir de aquí el changelog se auto-actualiza al igual que el backend.

### ✨ Features

* add release-it configuration for automated versioning and changelog generation ([ac55c1f](https://github.com/stocka-app/stocka-client/commit/ac55c1f80820cdb295ba893f5c1aff9b77d4ce41))

### 🧹 Chores

* add .githooks/post-merge to .gitignore ([29fa20c](https://github.com/stocka-app/stocka-client/commit/29fa20c5bbee4e0884bbddda5a49edd8b0c9e756))
* update .gitignore to include all githooks ([db0ccd5](https://github.com/stocka-app/stocka-client/commit/db0ccd5744682b3eb8daf01d7de51e57db1282c2))

## 0.1.0 (2026-03-18)

> **🚀 Sprint 1 — Fundamentos: La interfaz base de Stocka**
>
> Release fundacional del frontend. Establece la arquitectura de la aplicación y cubre todo el flujo de autenticación de extremo a extremo, conectado al backend real.
>
> **Arquitectura y setup:**
> - React 19 + Vite 7, feature-based architecture con alias `@/`
> - Zustand con persistencia en `localStorage` para auth state y theme
> - Axios con interceptores para token refresh silencioso — el usuario nunca ve un 401
> - Validación de env vars con Zod al startup — fail-fast antes de montar la app (STOC-198)
> - i18n EN/ES desde el primer día con `react-i18next`, 100% de strings traducidas incluyendo accesibilidad (STOC-174)
> - Design tokens DS-004 integrados en `globals.css` + Tailwind — modo oscuro funcional
>
> **Auth — Flujo completo:**
> - Sign-in / Sign-up con validación Zod + `react-hook-form`
> - Verificación de email: código de 6 dígitos, timer de reenvío, estado persistido entre recargas
> - Forgot/Reset password con pre-fill de email desde Sign In (STOC-181)
> - OAuth: Google, Facebook, Microsoft — `OAuthCallbackPage` con manejo de estados de error bilingüe (STOC-170)
> - Apple removido del frontend en sincronía con el backend (ADR-001)
> - Refresh token migrado a cookie httpOnly (STOC-216) — el interceptor de Axios ya no maneja tokens en memoria
> - Rate limiting UI en Login: banner de bloqueo con countdown cuando el backend retorna 429
> - Banner de cuenta social cuando el backend retorna `SOCIAL_ACCOUNT_REQUIRED` (STOC-222)
>
> **UX / UI:**
> - Layout split-panel para Sign In y Sign Up — diseño basado en spec DS-003/DS-004
> - `AuthLayout` reutilizable con ilustración SVG en panel derecho
> - `PageLoader` con skeleton para transiciones de ruta
> - `ErrorBoundary` wrapeando todas las rutas — errores de render no rompen la app entera
> - Animación shake en formularios para feedback de error sin texto redundante
>
> **Guards de ruta:**
> - `ProtectedRoute` — redirige a Login si no autenticado
> - `PublicRoute` — redirige al Dashboard si ya autenticado
> - `VerificationRoute` / `EmailVerifiedGuard` — gate de verificación de email entre Sign Up y Dashboard
>
> **Testing:**
> - Primer test FE: forgot password email prefill (STOC-181)
> - Suite completa con Vitest + @testing-library/react, estructura BDD Given/When/Then
> - Mocks centralizados en `src/test/mocks/` — `auth.mock.ts`, `i18n.mock.ts`
> - **100% de coverage con Vitest v8** ([STOC-268](https://austins-industries.atlassian.net/browse/STOC-268)) — statements / branches / functions / lines

### ✨ Features

* add Logo, Spinner, and LanguageSwitcher components ([b4bf916](https://github.com/stocka-app/stocka-client/commit/b4bf9166cea41b194890bb6daa4d99a2b9ad0a55))
* add shared types, API client, and hooks barrel export ([920d10f](https://github.com/stocka-app/stocka-client/commit/920d10f224776769b628417b069276bdfbce10a2))
* **api:** add axios interceptors for token refresh ([c08daaa](https://github.com/stocka-app/stocka-client/commit/c08daaa2202b874a9f9c178676412fa946b8ac29))
* **app:** add application entry point, providers, and routing setup ([4a839aa](https://github.com/stocka-app/stocka-client/commit/4a839aa73bc602bc47695fe0574bd50c79e768f7))
* **auth:** add auth store, mock API, and useAuth hook ([13759f1](https://github.com/stocka-app/stocka-client/commit/13759f1a1f0a416e137375f7010e611935bda1c3))
* **auth:** add authentication types and Zod validation schemas ([3d18364](https://github.com/stocka-app/stocka-client/commit/3d1836467f739838020ba8ec702d554f5b6f071f))
* **auth:** add email verification UI components ([a3794d8](https://github.com/stocka-app/stocka-client/commit/a3794d87f9310a2a7fff674ac98845aca3ae19f6))
* **auth:** add EmailVerifiedGuard for route protection ([4093ce1](https://github.com/stocka-app/stocka-client/commit/4093ce17608ce19da6d65bd58274c7af86e707eb))
* **auth:** add localized messages for OAuth callback states ([876d455](https://github.com/stocka-app/stocka-client/commit/876d4551e387b4c049c1dc5bf75a0ecf02eee8b2))
* **auth:** add login and register form components ([71fd560](https://github.com/stocka-app/stocka-client/commit/71fd5601cf41ae17344de19353eac60e31077135))
* **auth:** add Login and Register pages with barrel exports ([fff58e0](https://github.com/stocka-app/stocka-client/commit/fff58e00aee5c0beca594f6dfa1f035673ddce1f))
* **auth:** add Microsoft OAuth button, remove Apple ([8d93d6a](https://github.com/stocka-app/stocka-client/commit/8d93d6a2666ec3e02b55c570ea3afd531c5e63f3))
* **auth:** add ProtectedRoute, PublicRoute, and VerificationRoute components for route guarding ([e25aeef](https://github.com/stocka-app/stocka-client/commit/e25aeeffd96243b3ac1dcbc1aac916785cdeea26))
* **auth:** add real API service for authentication ([e72e678](https://github.com/stocka-app/stocka-client/commit/e72e67813e954fd27f23069e3a2fa3b3fd7157fc))
* **auth:** add verificationEmailSent state and alert for email delivery failure ([b14d680](https://github.com/stocka-app/stocka-client/commit/b14d680d4e9e58738fa600e0169b57322c45aa95))
* **auth:** add VerifyEmailForm component ([9e6386d](https://github.com/stocka-app/stocka-client/commit/9e6386d91c3892e6e5a042b3cb36dee51c5d8241))
* **auth:** add VerifyEmailPage and OAuthCallbackPage ([301b9c4](https://github.com/stocka-app/stocka-client/commit/301b9c4d349ea77d1c8517ceda89e4291b3d1760))
* **auth:** clear bilingual error messages for OAuth and auth flows (STOC-170) ([636be39](https://github.com/stocka-app/stocka-client/commit/636be39af3ff0e62d39f6bd519ebbc49702c8695))
* **auth:** enhance OAuth callback handling with improved user validation and optional user retrieval ([382c22d](https://github.com/stocka-app/stocka-client/commit/382c22d7a61039c982f1e7f16750e0989256a70f))
* **authentication:** restructure authentication feature with new types and localization ([0e9ce37](https://github.com/stocka-app/stocka-client/commit/0e9ce3717fcbf998b69404c18bea9df84750a38f))
* **auth:** export guards and authService from feature barrel ([f9c88b4](https://github.com/stocka-app/stocka-client/commit/f9c88b4a918eda03f125b124166fcd0d58dabaa1))
* **auth:** export new pages from barrel ([8999b1c](https://github.com/stocka-app/stocka-client/commit/8999b1cc3defa6450937db794247120a5ffbb062))
* **auth:** export verification components from barrel ([c95fb2e](https://github.com/stocka-app/stocka-client/commit/c95fb2e7041af2c282da8b4278b986b3ba75c21d))
* **auth:** implement password reset flow and fix OAuth callback i18n ([b22047d](https://github.com/stocka-app/stocka-client/commit/b22047d78c266b4786326c5b3cb9628612ff9715))
* **auth:** implement rate limiting UI for login ([2260c21](https://github.com/stocka-app/stocka-client/commit/2260c2118928b1a55d1e022aed59943377525f6a))
* **auth:** integrate backend error metadata for verification flow ([2e3a6c3](https://github.com/stocka-app/stocka-client/commit/2e3a6c3084d2a6bb22ca02a3fef332a5d414e52a))
* **auth:** migrate refresh token to httpOnly cookie (STOC-216) ([5069b3f](https://github.com/stocka-app/stocka-client/commit/5069b3f075c820d545e9555d0b4552a4c3448d1e))
* **auth:** replace Apple with Microsoft in OAuthProvider type ([4517068](https://github.com/stocka-app/stocka-client/commit/4517068a6e23a81f8347c7dc736799af6af091e1))
* **auth:** show OAuth provider banner when SOCIAL_ACCOUNT_REQUIRED error (STOC-222) ([b9d12d5](https://github.com/stocka-app/stocka-client/commit/b9d12d5e511a9987a9ab02f37ff3aaffff976820))
* **auth:** update Zustand store for real API integration ([b0d9210](https://github.com/stocka-app/stocka-client/commit/b0d9210022768ab6725a974d3a1e47705274e4a5))
* **auth:** use Microsoft OAuth button in LoginForm ([32263c2](https://github.com/stocka-app/stocka-client/commit/32263c2ce74461b7639d17880733806fe2dd0114))
* **auth:** use Microsoft OAuth button in RegisterForm ([664d870](https://github.com/stocka-app/stocka-client/commit/664d870e59f6086c582d8d74ccb62805a19aa686))
* **dashboard:** add initial Dashboard page ([96d1bac](https://github.com/stocka-app/stocka-client/commit/96d1bac4490b30ef2040a4b04e43a65d6601e4d7))
* **env:** validate env vars with Zod at startup — fail-fast (STOC-198) ([e0d2c42](https://github.com/stocka-app/stocka-client/commit/e0d2c421d986be3402de08896385e9affd597697))
* **error-boundary:** add ErrorBoundary and ThrowError components for error handling ([3b08bae](https://github.com/stocka-app/stocka-client/commit/3b08bae61ccf162bbd0fd534a958e9af492e74cb))
* **fe/auth:** redesign Sign In & Sign Up screens with split-panel layout ([1d771ac](https://github.com/stocka-app/stocka-client/commit/1d771ac4698b56f235f2ac2184ffb332d0c0efed))
* **fe/auth:** rename auth variables to authentication for consistency ([a4e451e](https://github.com/stocka-app/stocka-client/commit/a4e451ef46dbce93ed7121ec420a94d421ef56e0))
* **i18n:** add common translations for redirecting and tryAgain ([a5e827d](https://github.com/stocka-app/stocka-client/commit/a5e827d1cb59b0e68bc31a5e319c9b8a36cce594))
* **i18n:** add error boundary translations for English and Spanish locales ([83e930e](https://github.com/stocka-app/stocka-client/commit/83e930e426b6e19f7d8f802df6f9ef57baf153e7))
* **i18n:** add internationalization support with EN/ES translations ([ee5fca8](https://github.com/stocka-app/stocka-client/commit/ee5fca8767b3eb13cda019deb8576c5deb40f9fe))
* **i18n:** add Microsoft OAuth translations in English ([6bc63ee](https://github.com/stocka-app/stocka-client/commit/6bc63ee24da5865419aca4ebe9751e2624923c90))
* **i18n:** add Microsoft OAuth translations in Spanish ([f86b2b1](https://github.com/stocka-app/stocka-client/commit/f86b2b196cc630e5d0b0714cd0e9f3d37162559d))
* **i18n:** translate remaining hardcoded accessibility strings in auth (STOC-174) ([df91fca](https://github.com/stocka-app/stocka-client/commit/df91fca6769b04236e591c13da61aafe54e553f3))
* **layout:** add AuthLayout with split-screen design ([03c9caf](https://github.com/stocka-app/stocka-client/commit/03c9caf737a3bc3c17bf3e38a9b6a4664a131b47))
* **loader:** add PageLoader component with skeleton loading UI ([4404cde](https://github.com/stocka-app/stocka-client/commit/4404cde765907ea721894abcf51d05979530c3ac))
* **router:** add verification routes and update guards ([2a8142d](https://github.com/stocka-app/stocka-client/commit/2a8142dc58efff23f84c1e674b93a0f1e797ffeb))
* **router:** wrap routes in ErrorBoundary for improved error handling ([79af72d](https://github.com/stocka-app/stocka-client/commit/79af72d41cbbdbddcff4f52519d1ac16bd163021))
* **theme:** add ThemeToggle component and barrel export ([8635dfc](https://github.com/stocka-app/stocka-client/commit/8635dfcda5b18ace852e5560552bc3d013a9afff))
* **theme:** add useTheme hook and barrel export ([38ca4b9](https://github.com/stocka-app/stocka-client/commit/38ca4b949de48e6db6d364f4a0138ad5562018d3))
* **theme:** add Zustand theme store with persist and DOM side effects ([55c1a28](https://github.com/stocka-app/stocka-client/commit/55c1a284713bcfb9b252eb44780fa6ee77c24623))
* **theme:** wire DS-004 design tokens into globals.css and Tailwind ([eac0095](https://github.com/stocka-app/stocka-client/commit/eac00953bd36eebf60f4e1b2fd2b7ef10488860d))
* **ui:** add card, checkbox, form, and dropdown-menu components ([892483e](https://github.com/stocka-app/stocka-client/commit/892483e041784a24f17402280e1d022631aaa2bb))
* **ui:** add shake animation for error feedback ([344b1b6](https://github.com/stocka-app/stocka-client/commit/344b1b696cd057659c9883bd064badc89ae8e48b))
* **ui:** add shared utility functions and base UI components ([12339f1](https://github.com/stocka-app/stocka-client/commit/12339f12f1c6ca3e84098b64b5956ba90056e185))
* **ui:** add SVG illustration components for auth pages ([baba67f](https://github.com/stocka-app/stocka-client/commit/baba67f38b5af0181ed33f1dff38d38b349c6dc5))
* **ux:** pre-fill email on Forgot Password from Sign In (STOC-181) ([f26284d](https://github.com/stocka-app/stocka-client/commit/f26284dfcdb8e3ee2962f5afdd23499cf4efc6f4))

### 🐛 Bug Fixes

* **api:** improve error handling in response interceptor for better error message formatting ([6db6f9d](https://github.com/stocka-app/stocka-client/commit/6db6f9d963508233603f942cc4c6311e61f1040d))
* **auth:** add status field to mock user responses ([a802d1a](https://github.com/stocka-app/stocka-client/commit/a802d1a03ce17774c454ea3ee4e16ceb7dd76eb5))
* **auth:** fix password reset bugs and format codebase (STOC-183, STOC-200) ([c365c1c](https://github.com/stocka-app/stocka-client/commit/c365c1ceddbe84e9f1eac1110dc6643fff6af78a))
* **auth:** improve email verification UX and persistence ([629bc3b](https://github.com/stocka-app/stocka-client/commit/629bc3bd16e905c14831442d5a7576b0c7a4e88c))
* **auth:** prevent page reload on invalid credentials error ([0cfc2b5](https://github.com/stocka-app/stocka-client/commit/0cfc2b5d954c5db5d212c68775343c950a4f4460))
* **auth:** refine blockInfo handling and improve error message display in LoginForm ([a210f83](https://github.com/stocka-app/stocka-client/commit/a210f837aee2568a75c4897dc5033c0f8aee6185))
* **auth:** reset timer and resend button when code is resent ([c0f4ef6](https://github.com/stocka-app/stocka-client/commit/c0f4ef6bef3705847cf452512aaebf8e6eb498a5))
* **auth:** show only relevant option based on email verification status ([d9e17f3](https://github.com/stocka-app/stocka-client/commit/d9e17f3feedf3c8ba23a2d78e37b6114dd4b7b45))
* **i18n:** rename duplicate forgotPassword key to forgotPasswordPage ([3fd3e34](https://github.com/stocka-app/stocka-client/commit/3fd3e345f66fb17245e217b1ef03a04e734bf034))
* **vite:** update path import to use 'node:path' for consistency ([5002248](https://github.com/stocka-app/stocka-client/commit/50022489ee240509e93b0dc36c1f92f144b615c8))

### 🔧 Refactoring

* **auth:** change function exports to default exports for consistency ([e8f730d](https://github.com/stocka-app/stocka-client/commit/e8f730d15abd5ebf1ce5e30278c1d34056fe2433))
* **auth:** implement Zod contracts for API request/response validation ([12a20a6](https://github.com/stocka-app/stocka-client/commit/12a20a620f21dd6b3f91b2a6e4f1655ade7337d4))
* **auth:** remove canVerify from sign-up flow ([2e564e1](https://github.com/stocka-app/stocka-client/commit/2e564e13bf0cc6687624d694f84e77143ce2bcac))
* **tests:** add explicit Then block and use product-oriented language ([0fc94d8](https://github.com/stocka-app/stocka-client/commit/0fc94d8f8d6672788b11e0a1809a92e34c64cb52))
* **tests:** apply BDD conventions and extract shared mocks ([9cdf20a](https://github.com/stocka-app/stocka-client/commit/9cdf20a7385dd390d73d91c38448e01144972501))
* **tests:** apply full Given/When/Then BDD structure ([102909f](https://github.com/stocka-app/stocka-client/commit/102909f8c2281de5b1121485282d5ebf43c7f503))
* **tests:** move Then into it() name instead of a describe wrapper ([b7e2c91](https://github.com/stocka-app/stocka-client/commit/b7e2c911b4d62dd47e99084937b8fdf0b301edaa))

### 📚 Documentation

* add project README with setup and usage instructions ([9379e23](https://github.com/stocka-app/stocka-client/commit/9379e238f18b6dd125138473829afeec309f9565))

### 🧹 Chores

* [STOC-268](https://austins-industries.atlassian.net/browse/STOC-268) — add coverage/ to .gitignore ([9aec971](https://github.com/stocka-app/stocka-client/commit/9aec971de54d9481dbfe7af852597a9699b206a4))
* add environment configuration files ([ddb6163](https://github.com/stocka-app/stocka-client/commit/ddb6163fe6cd1ffd95a1f1bb00cc9c47c8835c8c))
* add public assets and static SVG files ([aa25e06](https://github.com/stocka-app/stocka-client/commit/aa25e066db3f7649795e8fd7e3aa907c387845e0))
* initialize Vite project with React and TypeScript ([def6b65](https://github.com/stocka-app/stocka-client/commit/def6b6504781cbced72f919c485f951b2f5bf758))
* **tooling:** configure Prettier with ESLint integration (STOC-200) ([e197b8b](https://github.com/stocka-app/stocka-client/commit/e197b8b6b955d1c631bdb79633744122920b31a0))

### ✅ Tests

* **auth:** add first FE test — forgot password email prefill (STOC-181) ([bc0e528](https://github.com/stocka-app/stocka-client/commit/bc0e528674292b6f515182f952068fc0f2bef6a7))
* **coverage:** [STOC-268](https://austins-industries.atlassian.net/browse/STOC-268) — FE unit tests + 100% coverage with Vitest v8 ([ae160a1](https://github.com/stocka-app/stocka-client/commit/ae160a160952a9ee07ca88aa575528d7ce95cba5))

### 🎨 Styles

* **auth:** unify social login buttons design ([5a67d19](https://github.com/stocka-app/stocka-client/commit/5a67d19eb04ef1baa347a8d2a10e0ac1039573b9)), closes [#1877F2](https://github.com/stocka-app/stocka-client/issues/1877F2)
* **auth:** use outline style for social login buttons ([a83005a](https://github.com/stocka-app/stocka-client/commit/a83005ae29019c33fadd2f521c7c7d4775a93220))
* configure Tailwind CSS with custom theme and global styles ([d15a33e](https://github.com/stocka-app/stocka-client/commit/d15a33e44f4c26e84169195b368338060099d3ae))
