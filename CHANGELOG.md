# Stocka Client — Changelog

All notable changes to this project are documented here.


## [0.17.0](https://github.com/stocka-app/stocka-client/compare/v0.16.0...v0.17.0) (2026-04-09)

> **Sprint 2 · H-03 StorageSwitcher end-to-end + Tier Capabilities polish**
>
> This release lands the full **H-03 storage context switcher** (STOC-317)
> — the Zustand store with tenant-scoped persist, the `useStorages` hook
> extension, the sidebar `StorageSwitcher` component with grouped
> dropdown, the `StorageCard` active-context treatment, the global
> `StorageStatusBanner`, and the AppLayout integration. The active storage
> context is now a first-class preference that survives reloads per
> tenant, drives the grid order, and surfaces FROZEN / ARCHIVED states as
> a sticky banner above the main content.
>
> **Architectural decisions**
>
> - **Tenant-scoped persistence:** a custom `StateStorage` adapter reads
>   `tenantId` from `useAuthenticationStore` and scopes the key as
>   `stocka:active-storage:{tenantId}`, so switching accounts never leaks
>   the previous tenant's selection. `partialize` keeps only
>   `activeStorageId` in the persist payload.
> - **Dual responsive trigger:** instead of conditional child spans, the
>   switcher renders two sibling `<button>` elements with mutually
>   exclusive visibility (FULL at mobile drawer + lg-expanded, COMPACT
>   40×40 square at md + lg-collapsed). Eliminates a class of visual
>   leakage bugs where hidden decorations bled into the compact state.
> - **Router state for the create CTA:** clicking "+ Crear nueva
>   instalación" navigates to `/storages` with `location.state =
>   { openCreateDrawer: true }`. `StoragesPage` reacts in a `useEffect`
>   (not a `useState` lazy initializer — the user may already be on
>   `/storages` and the page does not remount) and immediately clears
>   the history state via `navigate(pathname, { replace: true, state:
>   null })` so reload/back navigation does not retrigger the drawer.
> - **Design system semantic tokens:** both banners (FROZEN / ARCHIVED)
>   and the grouped dropdown use the `info`, `neutral-*`, and `border`
>   semantic tokens from `globals.css`, which auto-invert between light
>   and dark mode via CSS vars. Hardcoded `blue-*` / `neutral-*` scales
>   with manual `dark:` prefixes were replaced wholesale — the dropdown
>   active item bg moved from `neutral-100` to `neutral-200` so the
>   state delta reads correctly against the inverted dark scale.
> - **Bodega palette shift:** `--color-inst-bodega-*` moved from the
>   amber family (the `-text` token rendered as brown/café in light
>   mode) to the orange family. A single token change propagates to
>   cards, switcher, stats bar, and tabs without per-component overrides.
>
> **FASE 5 manual-validation feedback loop:** 10 follow-up fix commits
> were merged in the same PR after Roberto's visual walkthrough — bodega
> orange, banner DS tokens, active-item contrast in dark mode, icon
> color collision with almacen, filled type icons via the `FILL`
> Material Symbols axis, gradient fade on scroll, responsive dual
> trigger, create CTA 404 → auto-open drawer, and the switcher fetch
> hard cap (`limit: 100` matching the backend's `ListStoragesInDto`
> `@Max(100)`).
>
> **FASE 6 tests:** consolidated unit coverage after the UX was stable —
> 405 tests in `src/features/storages` at **100%** statements/branches/
> functions/lines. New or extended specs: store (selectors + tenant-
> scoped persistence), hook (active-context derived data), switcher
> (FE-SW1→13), card (FE-SC4→8), banner (FE-BN1→8), page (FE-SP1→3
> ordering + drawer auto-open).
>
> **FASE 7 E2E:** 3 new Playwright specs covering PW-8 through PW-15 —
> active-context ordering, floating popover position, grouped sections,
> FROZEN banner + dismiss + reload behavior, Reactivate flow, and the
> mobile drawer variant with the popover anchored over the overlay.
>
> The release also bundles the **STOC-429 tier capabilities** work that
> landed on main ahead of H-03 — global tier capabilities hook,
> typeSummary consumption for tab counts, type-cards tier gating, and
> the step-1 create flow quota guard.

### ✨ Features

* **i18n:** [STOC-341](https://austins-industries.atlassian.net/browse/STOC-341) — add missing cancel key to createDrawer namespace ([6785330](https://github.com/stocka-app/stocka-client/commit/67853303d5877eb131bfedce82fbd49de75558d4))
* **layout:** [STOC-346](https://austins-industries.atlassian.net/browse/STOC-346) — integrate StorageSwitcher + StorageStatusBanner into AppLayout ([db45fbb](https://github.com/stocka-app/stocka-client/commit/db45fbba077819d06e5e2ad24d1678697e64d85d))
* **onboarding:** [Sprint 2] add icon and color picker to custom room form in Step4Spaces ([4727d72](https://github.com/stocka-app/stocka-client/commit/4727d72a36453e62a6a5b6a46d420ddf8e65fce6))
* **shared:** [STOC-429](https://austins-industries.atlassian.net/browse/STOC-429) — add global tier capabilities system ([6d6cd55](https://github.com/stocka-app/stocka-client/commit/6d6cd554aff275de024ecd13f56f1256c1853fdc))
* **storages:** [STOC-343](https://austins-industries.atlassian.net/browse/STOC-343) — add activeStorageId state + sortedStorages selector with tenant-scoped persistence ([ce6df7d](https://github.com/stocka-app/stocka-client/commit/ce6df7d7dcc0b3365b970841bd6e28fac84b637d))
* **storages:** [STOC-344](https://austins-industries.atlassian.net/browse/STOC-344) — extend useStorages hook with active context (activeStorage, sortedStorages, setActiveStorage, hydrate) ([2ab1290](https://github.com/stocka-app/stocka-client/commit/2ab12902df6644ef1385cc6cf29fc1dc867e7a33)), closes [#0](https://github.com/stocka-app/stocka-client/issues/0)
* **storages:** [STOC-345](https://austins-industries.atlassian.net/browse/STOC-345) — implement StorageSwitcher with lateral dropdown, dot system, sticky CTA ([c9fc737](https://github.com/stocka-app/stocka-client/commit/c9fc7370e109223e1bcb819c7bde435e66e4596a)), closes [#0](https://github.com/stocka-app/stocka-client/issues/0)
* **storages:** [STOC-347](https://austins-industries.atlassian.net/browse/STOC-347) — add i18n keys for StorageSwitcher and StorageStatusBanner ([779c3af](https://github.com/stocka-app/stocka-client/commit/779c3af9d760858dbbcf8282e9a58565bedd4a25))
* **storages:** [STOC-429](https://austins-industries.atlassian.net/browse/STOC-429) — consume status summary from API for accurate StatsBar counts ([3fc5352](https://github.com/stocka-app/stocka-client/commit/3fc5352b2e9acb40a13b59734562e66494750228))
* **storages:** [STOC-429](https://austins-industries.atlassian.net/browse/STOC-429) — consume typeSummary for tab counts, enforce tier limits per tab ([d416b21](https://github.com/stocka-app/stocka-client/commit/d416b210cba0a5d582fb1caf67800b25709a57d4))
* **storages:** [STOC-429](https://austins-industries.atlassian.net/browse/STOC-429) — show search/filter controls disabled on tier-gated tabs ([6bff4d9](https://github.com/stocka-app/stocka-client/commit/6bff4d942945efd7f95733253291d459a53d29d9))
* **storages:** [STOC-429](https://austins-industries.atlassian.net/browse/STOC-429) — tier gate UX polish — unified view, filter block, stats reset, archived stat ([f980271](https://github.com/stocka-app/stocka-client/commit/f980271777a2e73bab5a10ef82285e97ba0f69b2))
* **storages:** [STOC-429](https://austins-industries.atlassian.net/browse/STOC-429) — tier-gate step 1 type cards, tab lock icon, modal quota guard ([7beccb8](https://github.com/stocka-app/stocka-client/commit/7beccb862590d0211ab3a89b29fb412d53563642))
* **storages:** [STOC-429](https://austins-industries.atlassian.net/browse/STOC-429) — wire tier capabilities into storages feature ([ad0b86c](https://github.com/stocka-app/stocka-client/commit/ad0b86c11c6984add8db88f59404a0a67a4af7a3))
* **storages:** [STOC-430](https://austins-industries.atlassian.net/browse/STOC-430) — add active-context treatment to StorageCard (bg pastel + ring + tag) ([e7e172f](https://github.com/stocka-app/stocka-client/commit/e7e172f572cf1e92fff98fef020b8e9de9f736bf))
* **storages:** [STOC-431](https://austins-industries.atlassian.net/browse/STOC-431) — add StorageStatusBanner global for FROZEN/ARCHIVED active context ([3b71854](https://github.com/stocka-app/stocka-client/commit/3b7185478a240605d0325957c0db5b24a36b73dc))
* **storages:** [STOC-432](https://austins-industries.atlassian.net/browse/STOC-432) — apply "contexto actual primero" ordering in StoragesPage grid ([89532c6](https://github.com/stocka-app/stocka-client/commit/89532c6a95f88a860f67095d4b8211a5e5b9623f)), closes [#0](https://github.com/stocka-app/stocka-client/issues/0)

### 🐛 Bug Fixes

* **build:** resolve pre-existing tsc and lint errors across codebase ([5307b9d](https://github.com/stocka-app/stocka-client/commit/5307b9dfe68665cb705a842d90d37522b58d62fc))
* **design-system:** [STOC-346](https://austins-industries.atlassian.net/browse/STOC-346) — bodega accent from amber to orange ([f77cc64](https://github.com/stocka-app/stocka-client/commit/f77cc643e4e8f03a9d16c7f75cf2774d4f629308)), closes [#d97706](https://github.com/stocka-app/stocka-client/issues/d97706) [#92400e](https://github.com/stocka-app/stocka-client/issues/92400e) [#92400e](https://github.com/stocka-app/stocka-client/issues/92400e) [#d97706](https://github.com/stocka-app/stocka-client/issues/d97706) [#d97706](https://github.com/stocka-app/stocka-client/issues/d97706) [#ea580c](https://github.com/stocka-app/stocka-client/issues/ea580c) [#fef3c7](https://github.com/stocka-app/stocka-client/issues/fef3c7) [#ffedd5](https://github.com/stocka-app/stocka-client/issues/ffedd5) [#92400e](https://github.com/stocka-app/stocka-client/issues/92400e) [#c2410c](https://github.com/stocka-app/stocka-client/issues/c2410c) [#fbbf24](https://github.com/stocka-app/stocka-client/issues/fbbf24) [#fb923c](https://github.com/stocka-app/stocka-client/issues/fb923c) [#fde68a](https://github.com/stocka-app/stocka-client/issues/fde68a) [#fed7aa](https://github.com/stocka-app/stocka-client/issues/fed7aa)
* **storages:** [Sprint 2] use global typeCounts for tier limits and improve type-tab empty state ([2e2f185](https://github.com/stocka-app/stocka-client/commit/2e2f185ecd08583076654d9ae22dc555994bed27))
* **storages:** [STOC-316](https://austins-industries.atlassian.net/browse/STOC-316) — replace auto-advance with explicit Continue button in drawer Step 1 ([a9646e5](https://github.com/stocka-app/stocka-client/commit/a9646e5b179ea55ea344b29d94bf7b8d40562904))
* **storages:** [STOC-346](https://austins-industries.atlassian.net/browse/STOC-346) — add bottom gradient fade to switcher scroll area ([56a4022](https://github.com/stocka-app/stocka-client/commit/56a40222df0f2d04adb701241b5078731776c7fd))
* **storages:** [STOC-346](https://austins-industries.atlassian.net/browse/STOC-346) — banner colors use DS semantic tokens ([b09b498](https://github.com/stocka-app/stocka-client/commit/b09b4981e0544d542e139da0c51d803ce6664215)), closes [#60a5fa1F](https://github.com/stocka-app/stocka-client/issues/60a5fa1F) [#60a5fa](https://github.com/stocka-app/stocka-client/issues/60a5fa) [#1e293b](https://github.com/stocka-app/stocka-client/issues/1e293b) [#cbd5e1](https://github.com/stocka-app/stocka-client/issues/cbd5e1) [#94a3b8](https://github.com/stocka-app/stocka-client/issues/94a3b8) [#273d5c](https://github.com/stocka-app/stocka-client/issues/273d5c)
* **storages:** [STOC-346](https://austins-industries.atlassian.net/browse/STOC-346) — cap switcher + banner fetch limit at 100 ([83f1c3b](https://github.com/stocka-app/stocka-client/commit/83f1c3b722b448a5f61c2f77803235dfcda04914))
* **storages:** [STOC-346](https://austins-industries.atlassian.net/browse/STOC-346) — group switcher dropdown by type + fix dark mode active contrast ([112d8e9](https://github.com/stocka-app/stocka-client/commit/112d8e91fc6f9f0b16a866a83288fe4cc56dccac)), closes [#182437](https://github.com/stocka-app/stocka-client/issues/182437) [#1e293b](https://github.com/stocka-app/stocka-client/issues/1e293b) [#0f172a](https://github.com/stocka-app/stocka-client/issues/0f172a) [#E5E7EB](https://github.com/stocka-app/stocka-client/issues/E5E7EB) [#334155](https://github.com/stocka-app/stocka-client/issues/334155) [#F3F4F6](https://github.com/stocka-app/stocka-client/issues/F3F4F6) [#1e293b](https://github.com/stocka-app/stocka-client/issues/1e293b)
* **storages:** [STOC-346](https://austins-industries.atlassian.net/browse/STOC-346) — switcher CTA navigates to /storages and auto-opens drawer ([2015661](https://github.com/stocka-app/stocka-client/commit/2015661393c4e0040b0f1f4ab8f6e6d83b05087c))
* **storages:** [STOC-346](https://austins-industries.atlassian.net/browse/STOC-346) — switcher icon type color takes priority ([0ddcc2b](https://github.com/stocka-app/stocka-client/commit/0ddcc2b37be41d852b801ddd40594b9724f55227)), closes [#3b82f6](https://github.com/stocka-app/stocka-client/issues/3b82f6)
* **storages:** [STOC-346](https://austins-industries.atlassian.net/browse/STOC-346) — switcher visible at every breakpoint via dual trigger ([c50719e](https://github.com/stocka-app/stocka-client/commit/c50719ec8104e4a1df6875a6ecf3d0b5d698e0aa))
* **storages:** [STOC-346](https://austins-industries.atlassian.net/browse/STOC-346) — unify storage type icons as filled ([f664e6e](https://github.com/stocka-app/stocka-client/commit/f664e6eca2497a64903f0ac7961c447000d577c8))
* **storages:** [STOC-429](https://austins-industries.atlassian.net/browse/STOC-429) — hide create card on All tab when every type is at tier limit ([00d0048](https://github.com/stocka-app/stocka-client/commit/00d004885b803528c78c64b08faab683962bae70))
* **storages:** hide stale cards and block actions in STATE 6 when tab is tier-gated ([4a55569](https://github.com/stocka-app/stocka-client/commit/4a5556992293eaa860c7468ce90be191dce08f58))
* **storages:** persist tab counts and center tier gate message in STATE 3.5 ([f96378e](https://github.com/stocka-app/stocka-client/commit/f96378e84812c0a5c767d5aa8f87da91a81f9160))

### 🔧 Refactoring

* **shared:** [Sprint 2] extract IconColorPicker to shared with constants file ([0b87214](https://github.com/stocka-app/stocka-client/commit/0b872148ab591b98ab3a20cb069369629f99ed2d))
* **storages:** [STOC-429](https://austins-industries.atlassian.net/browse/STOC-429) — replace hardcoded tier check in CreateEditStorageModal ([ec23264](https://github.com/stocka-app/stocka-client/commit/ec232644bc32b0f17d992110be2a9df01869fbf0))
* **storages:** absorb tier gate into STATE 5 instead of a separate early return ([7709c8d](https://github.com/stocka-app/stocka-client/commit/7709c8d7760ae10a10cddc0b6cf54c0e62c98349))

### 🧹 Chores

* **storages:** [STOC-348](https://austins-industries.atlassian.net/browse/STOC-348) — fix lint + tsc regressions in new coverage tests ([e11d28d](https://github.com/stocka-app/stocka-client/commit/e11d28d45685fb2d4e0a4524009ca6ea9edb5926))

### ✅ Tests

* **e2e:** [STOC-433](https://austins-industries.atlassian.net/browse/STOC-433) — add Playwright specs for StorageSwitcher PW-8 to PW-15 ([eb40148](https://github.com/stocka-app/stocka-client/commit/eb40148cec04070de855f50b4afb498889aa5533))
* **storages-e2e:** [STOC-316](https://austins-industries.atlassian.net/browse/STOC-316) — add tier limit E2E specs CD-39 through CD-46 ([0ff2f97](https://github.com/stocka-app/stocka-client/commit/0ff2f9768e193378911965a345e813fc375176e5))
* **storages:** [STOC-342](https://austins-industries.atlassian.net/browse/STOC-342) — BDD unit tests for CreateStorageDrawer — 26 tests, 100% coverage ([1311b21](https://github.com/stocka-app/stocka-client/commit/1311b21625f9fd575e8038aaf11fc1dcc1b58062))
* **storages:** [STOC-346](https://austins-industries.atlassian.net/browse/STOC-346) — mock react-router-dom in StoragesPage tests ([80267a7](https://github.com/stocka-app/stocka-client/commit/80267a747a58461105363dadbbf317e79aaf012f))
* **storages:** [STOC-348](https://austins-industries.atlassian.net/browse/STOC-348) — close H-03 coverage gaps to 100% ([eaf0fd3](https://github.com/stocka-app/stocka-client/commit/eaf0fd30a33785ccb2aa1562acc8f5890b2bd901))
* **storages:** [STOC-348](https://austins-industries.atlassian.net/browse/STOC-348) — cover active-context store, selectors and tenant-scoped persistence ([46a6cc9](https://github.com/stocka-app/stocka-client/commit/46a6cc91d8e63680a2223527b8531f13db1c5562))
* **storages:** [STOC-348](https://austins-industries.atlassian.net/browse/STOC-348) — cover StorageCard active-context treatment FE-SC4 to FE-SC8 ([cfad6f0](https://github.com/stocka-app/stocka-client/commit/cfad6f0cf5d6e083c9c0c08e83512eb45ba6bdb9))
* **storages:** [STOC-348](https://austins-industries.atlassian.net/browse/STOC-348) — cover StoragesPage active-context ordering and drawer auto-open ([b6dbd04](https://github.com/stocka-app/stocka-client/commit/b6dbd0477d793ab46c892aa0a6ae0d1d59b4fb67))
* **storages:** [STOC-348](https://austins-industries.atlassian.net/browse/STOC-348) — cover StorageStatusBanner behavior FE-BN1 to FE-BN8 ([163301e](https://github.com/stocka-app/stocka-client/commit/163301e639ecb498de480c728831172c1c5d78b3))
* **storages:** [STOC-348](https://austins-industries.atlassian.net/browse/STOC-348) — cover StorageSwitcher behavior FE-SW1 to FE-SW13 ([1539eef](https://github.com/stocka-app/stocka-client/commit/1539eefb0971e4e5fb4636d2c8bfadd1e13cbf78))
* **storages:** [STOC-348](https://austins-industries.atlassian.net/browse/STOC-348) — cover useStorages active-context derived data and hydration ([f153377](https://github.com/stocka-app/stocka-client/commit/f153377a7457b98705e17b5458da19653b4d89d1))
* **storages:** [STOC-424](https://austins-industries.atlassian.net/browse/STOC-424) — fix E2E specs — remove continueButton calls, align with auto-advance UX ([58e913f](https://github.com/stocka-app/stocka-client/commit/58e913f828e4435fff2e5e5f4b5297c5d32a1b62))
* **storages:** [STOC-429](https://austins-industries.atlassian.net/browse/STOC-429) — add BDD coverage for tier capabilities system ([51ec41d](https://github.com/stocka-app/stocka-client/commit/51ec41daf7a1b85a4f5641ea65030710174ac747))
* **storages:** [STOC-429](https://austins-industries.atlassian.net/browse/STOC-429) — fix test mocks for typeSummary/typeCounts — 100% coverage ([596df37](https://github.com/stocka-app/stocka-client/commit/596df3787c06e4543e1f604619dac666f80c4747))
* **storages:** [STOC-429](https://austins-industries.atlassian.net/browse/STOC-429) — tier-gate UX unit + E2E coverage ([c95dcf4](https://github.com/stocka-app/stocka-client/commit/c95dcf4c5c7d4cfc5f52bbacaff989baf368a205))

### 🎨 Styles

* **storages:** unify card min-height to 220px across all card variants ([a1c6147](https://github.com/stocka-app/stocka-client/commit/a1c61470f1d0bece57c1a7fa1946d14c8ead67a0))

## [0.16.0](https://github.com/stocka-app/stocka-client/compare/v0.15.0...v0.16.0) (2026-04-05)

### ✨ Features

* **shared:** [STOC-316](https://austins-industries.atlassian.net/browse/STOC-316) — add reusable Drawer component ([ddef97f](https://github.com/stocka-app/stocka-client/commit/ddef97fa9d7bb058098648cf09455326ee4f74ca))
* **storages:** [STOC-316](https://austins-industries.atlassian.net/browse/STOC-316) — add createWarehouse, createStoreRoom, createCustomRoom to useStorages ([c9f81cf](https://github.com/stocka-app/stocka-client/commit/c9f81cf8f7af432ca7b805aff347c77926ced8bc))
* **storages:** [STOC-316](https://austins-industries.atlassian.net/browse/STOC-316) — add type-specific create schemas and service methods ([6de8a5f](https://github.com/stocka-app/stocka-client/commit/6de8a5f595e4ae8943ee48d2e35d667219c5863f))
* **storages:** [STOC-316](https://austins-industries.atlassian.net/browse/STOC-316) — implement Crear Instalacion 2-step drawer ([7f0cb03](https://github.com/stocka-app/stocka-client/commit/7f0cb0374567b49476fc35d573f16c2c96b562f8))
* **storages:** [STOC-316](https://austins-industries.atlassian.net/browse/STOC-316) — refactor CreateStorageDrawer — live icon picker, dark mode, Drawer shell ([179a3b1](https://github.com/stocka-app/stocka-client/commit/179a3b1c35ad28973290fa6197a4cbb451881959))

### ✅ Tests

* **storages-e2e:** [STOC-316](https://austins-industries.atlassian.net/browse/STOC-316) — add Playwright E2E suite for CreateStorageDrawer ([e8c91e6](https://github.com/stocka-app/stocka-client/commit/e8c91e6fd83b14957d6607205feb00e905d88f6d))
* **storages:** [STOC-316](https://austins-industries.atlassian.net/browse/STOC-316) — add tests for new create methods and schemas, exclude drawer from coverage ([fa9a2e3](https://github.com/stocka-app/stocka-client/commit/fa9a2e385caef974fe5d96094a3f7048f659b4bd))

## [0.15.0](https://github.com/stocka-app/stocka-client/compare/v0.13.0...v0.15.0) (2026-04-01)

### ✨ Features

* **auth,onboarding:** optimize login requests — eliminate getMe, merge start+status ([ea6a30d](https://github.com/stocka-app/stocka-client/commit/ea6a30d7b16b77476a8f51b62b6a1afd89e53895))
* **authentication:** enhance OAuth popup flow and extend types ([144f6c8](https://github.com/stocka-app/stocka-client/commit/144f6c8d87bfa7edd5df45748941ea2ef2880c34))
* **i18n:** update storages and layout locales for all states ([43eb1bc](https://github.com/stocka-app/stocka-client/commit/43eb1bc7c38809ac80c2a73c83df570cc1811798))
* **storages:** implement all 7 visual states from Pencil design system ([958279b](https://github.com/stocka-app/stocka-client/commit/958279b0121eaf6570d94e51a0e863ccaa15c63f))
* **storages:** redesign card with dropdown menu and update validation ([27a3860](https://github.com/stocka-app/stocka-client/commit/27a386074441dc485f32a44b99af84a1830fd7c5))
* **storages:** redesign StorageCard with bracket, tokens, and responsive layout ([8cf6621](https://github.com/stocka-app/stocka-client/commit/8cf66219daaf79c4ca3bbe6bc8cbe4bd25690bf0))
* **tokens:** add category, installation, and brand-subtle design tokens ([3b6bf01](https://github.com/stocka-app/stocka-client/commit/3b6bf01b36a46454e809c9079d7718225bf54cd6))
* **ui:** add StateComposition, DoubleRingSpinner, and ProgressBar components ([115ce47](https://github.com/stocka-app/stocka-client/commit/115ce472ea13a79d8d1dd5b3c27fa17f238f4c04))

### 🐛 Bug Fixes

* **auth:** [STOC-414](https://austins-industries.atlassian.net/browse/STOC-414) — add refresh lock to prevent concurrent 401 refresh race condition ([8ab3216](https://github.com/stocka-app/stocka-client/commit/8ab3216fcb311eb9a2305624e43354cfb852a00e))
* **auth:** [STOC-414](https://austins-industries.atlassian.net/browse/STOC-414) — revert unnecessary ProtectedRoute condition and add missing 4th boolean guard combination ([3e7e40c](https://github.com/stocka-app/stocka-client/commit/3e7e40cb4598c1ab04bacf436097144d7dda3e43))
* **e2e:** [STOC-414](https://austins-industries.atlassian.net/browse/STOC-414) — fix 500 on viewer sign-in and onboarding happy path ([eface7f](https://github.com/stocka-app/stocka-client/commit/eface7fd4ed015169aae568555cce2336d6f6e9a))
* **e2e:** [STOC-414](https://austins-industries.atlassian.net/browse/STOC-414) — fix refresh token race and onboarding happy path resume ([7fefc7a](https://github.com/stocka-app/stocka-client/commit/7fefc7a8ba41936a2165d3d11848ce9eb32096d3))
* **e2e:** [STOC-414](https://austins-industries.atlassian.net/browse/STOC-414) — fix viewer password missing special char in rbac spec ([466af86](https://github.com/stocka-app/stocka-client/commit/466af86cc3d0daf2e4bc5a8fc0640185d114f8c1))
* **e2e:** [STOC-414](https://austins-industries.atlassian.net/browse/STOC-414) — scope verifiedUser fixture to worker and fix passwords ([30cd1a2](https://github.com/stocka-app/stocka-client/commit/30cd1a235a07732994fed10d1146a17a9750cc91))
* **e2e:** fix global setup, i18n locale, onboarding flow, and RBAC race condition ([0b6f40d](https://github.com/stocka-app/stocka-client/commit/0b6f40dd4fc2a4a410c886006add1785ef493a38))
* **onboarding:** [STOC-415](https://austins-industries.atlassian.net/browse/STOC-415) — fix businessType showing raw Zod enum error instead of localized message ([6d0353b](https://github.com/stocka-app/stocka-client/commit/6d0353bade6982fb7c036057d75f822905954390))
* **onboarding:** [STOC-415](https://austins-industries.atlassian.net/browse/STOC-415) — fix dead Zod v3 errorMap syntax and add coverage test for enum error message ([fd8db77](https://github.com/stocka-app/stocka-client/commit/fd8db7757fcca7fa75d71edbc68e9b7957edec92))
* **rbac:** [STOC-414](https://austins-industries.atlassian.net/browse/STOC-414) — add permissionsInflight guard to prevent concurrent loadPermissions calls ([e555bfb](https://github.com/stocka-app/stocka-client/commit/e555bfb10abfa794a30872ef710f476e9c6c21dd))
* **shared:** [STOC-414](https://austins-industries.atlassian.net/browse/STOC-414) — centralize refresh lock into executeRefresh shared by interceptor and hydrateAuth ([30836e3](https://github.com/stocka-app/stocka-client/commit/30836e36ee10ae674b6db81ac4fd2bdc0882d16d))
* **shared:** fix type errors in LanguageSwitcher, ErrorBoundary, and jwt ([77f69a1](https://github.com/stocka-app/stocka-client/commit/77f69a180f638539417dac0d9d5b9cb32e908079))
* **storages:** [STOC-415](https://austins-industries.atlassian.net/browse/STOC-415) — add AbortController to useStorages to cancel StrictMode duplicate requests ([2e7a2ec](https://github.com/stocka-app/stocka-client/commit/2e7a2ecf0b8f5194d38a6815c5594aafef52b9f4))
* **ui:** use semantic tokens for auth inputs and button variants ([54dea60](https://github.com/stocka-app/stocka-client/commit/54dea60770f6aa87e6e9351e214882106153a5e3))

### ⚡ Performance

* **e2e:** [STOC-414](https://austins-industries.atlassian.net/browse/STOC-414) — pre-seed users in globalSetup and eliminate UI sign-in per test ([e983ab1](https://github.com/stocka-app/stocka-client/commit/e983ab13671dfb718340732f47fdcbc11731a896))

### 🔧 Refactoring

* **app:** replace PageLoader skeleton with DoubleRingSpinner and eager-load StoragesPage ([6a157ff](https://github.com/stocka-app/stocka-client/commit/6a157ffb88c2935c00a7f315bf7ece4035adbf06))
* **auth:** remove legacy auth feature replaced by authentication module ([baed199](https://github.com/stocka-app/stocka-client/commit/baed19914e02c3a59b90cc19ec6a27fa781c7b2d))

### 📚 Documentation

* **e2e:** [STOC-414](https://austins-industries.atlassian.net/browse/STOC-414) — add Playwright optimization plan checklist ([0aeecf9](https://github.com/stocka-app/stocka-client/commit/0aeecf96a745322fe093008235644465e2ac0333))
* **e2e:** add storages list E2E test plan with 105 scenarios ([7941fd8](https://github.com/stocka-app/stocka-client/commit/7941fd8ad1d3ca85dd26e94efd63828c864ae3a1))

### 🧹 Chores

* **layout:** [STOC-414](https://austins-industries.atlassian.net/browse/STOC-414) — remove debug console.log from AppLayout ([95ca761](https://github.com/stocka-app/stocka-client/commit/95ca761ca475451f28850088d500ff9febd0cb23))
* **release:** [skip ci] 0.14.0 ([c6e843a](https://github.com/stocka-app/stocka-client/commit/c6e843ab78e42409bf0bc0c6018a318ee2798711))

### ✅ Tests

* **client:** expand unit test coverage across all features ([efe05dd](https://github.com/stocka-app/stocka-client/commit/efe05dd148bec7dd0050e2a8b38a0e470fb2e0a5))
* **coverage:** [Sprint 1] expand unit + E2E coverage across org, team, storages, layouts, auth ([4c0d2c0](https://github.com/stocka-app/stocka-client/commit/4c0d2c05079b4f27203154403fc5ce1e660abc3d))
* **e2e:** [STOC-414-415] | Sprint 2 | add Playwright E2E token refresh spec with abort deduplication validation ([bef9379](https://github.com/stocka-app/stocka-client/commit/bef9379927ac7276644a0ff821e2029ab6c91b08))
* **e2e:** add storages list E2E specs with page objects and helpers ([dc7c350](https://github.com/stocka-app/stocka-client/commit/dc7c350e9f289dc6dc8cf7d2c664ee68228a7bc8))
* **rbac:** [STOC-414](https://austins-industries.atlassian.net/browse/STOC-414) — add coverage test for permissionsInflight deduplication guard ([bd6c2da](https://github.com/stocka-app/stocka-client/commit/bd6c2dae2685729640ea3fccfbe3db8f820e2f9e))
* **shared:** [STOC-414](https://austins-industries.atlassian.net/browse/STOC-414) — add cross-layer integration tests for axios executeRefresh and CanceledError boundary ([9a6faf2](https://github.com/stocka-app/stocka-client/commit/9a6faf22dcd12917ae5bbecb663a0312b138769b))
* **storages:** [STOC-415](https://austins-industries.atlassian.net/browse/STOC-415) — add cancel/abort guard unit tests and cover useStorages boundary with CanceledError ([0d122c2](https://github.com/stocka-app/stocka-client/commit/0d122c26e061ae2219caa2a7708a8aedac78d876))

### 🏗️ Build System

* **client:** migrate to Tailwind v4, Vite 8, and upgrade dependencies ([5e84be6](https://github.com/stocka-app/stocka-client/commit/5e84be64f391eb1edbe6b3184902291a76190fda))

### deps

* **fonts:** install material-symbols locally ([a90f13c](https://github.com/stocka-app/stocka-client/commit/a90f13c115fe0e46672d39e316199c236f1a0d4c))

## [0.14.0](https://github.com/stocka-app/stocka-client/compare/v0.13.0...v0.14.0) (2026-03-27)

### ✨ Features

* **auth,onboarding:** optimize login requests — eliminate getMe, merge start+status ([ea6a30d](https://github.com/stocka-app/stocka-client/commit/ea6a30d7b16b77476a8f51b62b6a1afd89e53895))

### 🐛 Bug Fixes

* **auth:** [STOC-414](https://austins-industries.atlassian.net/browse/STOC-414) — add refresh lock to prevent concurrent 401 refresh race condition ([8ab3216](https://github.com/stocka-app/stocka-client/commit/8ab3216fcb311eb9a2305624e43354cfb852a00e))
* **auth:** [STOC-414](https://austins-industries.atlassian.net/browse/STOC-414) — revert unnecessary ProtectedRoute condition and add missing 4th boolean guard combination ([3e7e40c](https://github.com/stocka-app/stocka-client/commit/3e7e40cb4598c1ab04bacf436097144d7dda3e43))
* **e2e:** [STOC-414](https://austins-industries.atlassian.net/browse/STOC-414) — fix 500 on viewer sign-in and onboarding happy path ([eface7f](https://github.com/stocka-app/stocka-client/commit/eface7fd4ed015169aae568555cce2336d6f6e9a))
* **e2e:** [STOC-414](https://austins-industries.atlassian.net/browse/STOC-414) — fix refresh token race and onboarding happy path resume ([7fefc7a](https://github.com/stocka-app/stocka-client/commit/7fefc7a8ba41936a2165d3d11848ce9eb32096d3))
* **e2e:** [STOC-414](https://austins-industries.atlassian.net/browse/STOC-414) — fix viewer password missing special char in rbac spec ([466af86](https://github.com/stocka-app/stocka-client/commit/466af86cc3d0daf2e4bc5a8fc0640185d114f8c1))
* **e2e:** [STOC-414](https://austins-industries.atlassian.net/browse/STOC-414) — scope verifiedUser fixture to worker and fix passwords ([30cd1a2](https://github.com/stocka-app/stocka-client/commit/30cd1a235a07732994fed10d1146a17a9750cc91))
* **onboarding:** [STOC-415](https://austins-industries.atlassian.net/browse/STOC-415) — fix businessType showing raw Zod enum error instead of localized message ([6d0353b](https://github.com/stocka-app/stocka-client/commit/6d0353bade6982fb7c036057d75f822905954390))
* **onboarding:** [STOC-415](https://austins-industries.atlassian.net/browse/STOC-415) — fix dead Zod v3 errorMap syntax and add coverage test for enum error message ([fd8db77](https://github.com/stocka-app/stocka-client/commit/fd8db7757fcca7fa75d71edbc68e9b7957edec92))
* **rbac:** [STOC-414](https://austins-industries.atlassian.net/browse/STOC-414) — add permissionsInflight guard to prevent concurrent loadPermissions calls ([e555bfb](https://github.com/stocka-app/stocka-client/commit/e555bfb10abfa794a30872ef710f476e9c6c21dd))
* **shared:** [STOC-414](https://austins-industries.atlassian.net/browse/STOC-414) — centralize refresh lock into executeRefresh shared by interceptor and hydrateAuth ([30836e3](https://github.com/stocka-app/stocka-client/commit/30836e36ee10ae674b6db81ac4fd2bdc0882d16d))
* **storages:** [STOC-415](https://austins-industries.atlassian.net/browse/STOC-415) — add AbortController to useStorages to cancel StrictMode duplicate requests ([2e7a2ec](https://github.com/stocka-app/stocka-client/commit/2e7a2ecf0b8f5194d38a6815c5594aafef52b9f4))
* **ui:** use semantic tokens for auth inputs and button variants ([54dea60](https://github.com/stocka-app/stocka-client/commit/54dea60770f6aa87e6e9351e214882106153a5e3))

### ⚡ Performance

* **e2e:** [STOC-414](https://austins-industries.atlassian.net/browse/STOC-414) — pre-seed users in globalSetup and eliminate UI sign-in per test ([e983ab1](https://github.com/stocka-app/stocka-client/commit/e983ab13671dfb718340732f47fdcbc11731a896))

### 📚 Documentation

* **e2e:** [STOC-414](https://austins-industries.atlassian.net/browse/STOC-414) — add Playwright optimization plan checklist ([0aeecf9](https://github.com/stocka-app/stocka-client/commit/0aeecf96a745322fe093008235644465e2ac0333))

### 🧹 Chores

* **layout:** [STOC-414](https://austins-industries.atlassian.net/browse/STOC-414) — remove debug console.log from AppLayout ([95ca761](https://github.com/stocka-app/stocka-client/commit/95ca761ca475451f28850088d500ff9febd0cb23))

### ✅ Tests

* **e2e:** [STOC-414-415] | Sprint 2 | add Playwright E2E token refresh spec with abort deduplication validation ([bef9379](https://github.com/stocka-app/stocka-client/commit/bef9379927ac7276644a0ff821e2029ab6c91b08))
* **rbac:** [STOC-414](https://austins-industries.atlassian.net/browse/STOC-414) — add coverage test for permissionsInflight deduplication guard ([bd6c2da](https://github.com/stocka-app/stocka-client/commit/bd6c2dae2685729640ea3fccfbe3db8f820e2f9e))
* **shared:** [STOC-414](https://austins-industries.atlassian.net/browse/STOC-414) — add cross-layer integration tests for axios executeRefresh and CanceledError boundary ([9a6faf2](https://github.com/stocka-app/stocka-client/commit/9a6faf22dcd12917ae5bbecb663a0312b138769b))
* **storages:** [STOC-415](https://austins-industries.atlassian.net/browse/STOC-415) — add cancel/abort guard unit tests and cover useStorages boundary with CanceledError ([0d122c2](https://github.com/stocka-app/stocka-client/commit/0d122c26e061ae2219caa2a7708a8aedac78d876))

## [0.13.0](https://github.com/stocka-app/stocka-client/compare/v0.12.19...v0.13.0) (2026-03-26)

### ✨ Features

* **auth:** [STOC-401](https://austins-industries.atlassian.net/browse/STOC-401) — add tierLimits to JWT payload + User type ([c8c214b](https://github.com/stocka-app/stocka-client/commit/c8c214b310673e28129bcf2ad6b53db6e7ef3124))
* **spaces:** [STOC-328](https://austins-industries.atlassian.net/browse/STOC-328) — align Space schema with BE StorageOutDto ([fc9420e](https://github.com/stocka-app/stocka-client/commit/fc9420ef26a99a265c03bf73acb2164dc6ddc94e))
* **spaces:** [STOC-329](https://austins-industries.atlassian.net/browse/STOC-329) — extend useSpaces with filter/search/sort/permissions ([e10d9e3](https://github.com/stocka-app/stocka-client/commit/e10d9e3fd3db99ab097b34729fdf0181c88c9dc0))
* **spaces:** [STOC-330](https://austins-industries.atlassian.net/browse/STOC-330) — add SpaceCard component with type badge and role-based actions ([60acdae](https://github.com/stocka-app/stocka-client/commit/60acdaec691c4b2ec671bf9d2978183309acb996))
* **spaces:** [STOC-331](https://austins-industries.atlassian.net/browse/STOC-331) — refactor SpacesPage with stats panel, filter bar, card grid, and all empty/error states ([2951a2c](https://github.com/stocka-app/stocka-client/commit/2951a2c1624317e88f8c4c409df4754f2d9f226d))
* **spaces:** [STOC-332](https://austins-industries.atlassian.net/browse/STOC-332) — add remaining i18n keys for spaces list view ([0c4429d](https://github.com/stocka-app/stocka-client/commit/0c4429df6b8c16eea2202b75186a1425e44cae6e))
* **spaces:** [STOC-398](https://austins-industries.atlassian.net/browse/STOC-398) — add E2E RBAC visibility tests + wire loadPermissions in AppLayout ([42c3a11](https://github.com/stocka-app/stocka-client/commit/42c3a111109db9d18c7815eafdd5991c9cadac94))
* **storages:** [STOC-401](https://austins-industries.atlassian.net/browse/STOC-401) — add useCapabilities hook with JWT > API > fallback resolution ([d50af17](https://github.com/stocka-app/stocka-client/commit/d50af170dc017abbb9e30de3f268f8d7977a0a13))
* **storages:** [STOC-413](https://austins-industries.atlassian.net/browse/STOC-413) — move filter, search, sort to server-side; add pagination UI ([a450ba9](https://github.com/stocka-app/stocka-client/commit/a450ba9228ecb500403801b840be51ec78d91ab9))

### 🐛 Bug Fixes

* **storages:** [STOC-401](https://austins-industries.atlassian.net/browse/STOC-401) — resolve H-01 technical debt (STOC-404,405,407,408,411) ([dd85079](https://github.com/stocka-app/stocka-client/commit/dd8507995330927368aefd7dcb1e7f7996d6f497))

### 🔧 Refactoring

* **storages:** [STOC-401](https://austins-industries.atlassian.net/browse/STOC-401) — rename installation → storage in code + EN locale; ES keeps instalación ([6ff7b4a](https://github.com/stocka-app/stocka-client/commit/6ff7b4a4ff1e2c3b9294de17645985518f69b208))
* **storages:** [STOC-401](https://austins-industries.atlassian.net/browse/STOC-401) — wire StoragesPage to useCapabilities for restore limit check ([37ca224](https://github.com/stocka-app/stocka-client/commit/37ca22420419ccbf1f2361965d9a14803972dec9))
* **storages:** [STOC-403](https://austins-industries.atlassian.net/browse/STOC-403) — rename feature spaces → storages at code domain level ([14d76f3](https://github.com/stocka-app/stocka-client/commit/14d76f33cc2f62003e6fa8bd4b6e93c01cb1155f))

### ✅ Tests

* **spaces:** [STOC-333](https://austins-industries.atlassian.net/browse/STOC-333) — add FE-UH2 scenario for FROZEN + search AND logic in useSpaces ([6548dbf](https://github.com/stocka-app/stocka-client/commit/6548dbfff585063b3e7718b8a28d491759552aaf))

## [0.12.19](https://github.com/stocka-app/stocka-client/compare/v0.12.18...v0.12.19) (2026-03-26)

### 🐛 Bug Fixes

* **layout:** [STOC-255](https://austins-industries.atlassian.net/browse/STOC-255) — replace floating collapse toggle with integrated bottom button ([8f3c3e9](https://github.com/stocka-app/stocka-client/commit/8f3c3e99a93fe99f0cf6a9542a54dbd8424cfd98))

## [0.12.18](https://github.com/stocka-app/stocka-client/compare/v0.12.17...v0.12.18) (2026-03-26)

### 🐛 Bug Fixes

* **layout:** [STOC-255](https://austins-industries.atlassian.net/browse/STOC-255) — business selector shows selected name and stays visible when collapsed ([6888b0e](https://github.com/stocka-app/stocka-client/commit/6888b0e79655e9c35c268481ac467d402aae4489))

## [0.12.17](https://github.com/stocka-app/stocka-client/compare/v0.12.16...v0.12.17) (2026-03-26)

### 🐛 Bug Fixes

* **layout:** [STOC-255](https://austins-industries.atlassian.net/browse/STOC-255) — increase avatar size to h-10 w-10 ([33d5838](https://github.com/stocka-app/stocka-client/commit/33d58380eef912d8ea57f3dce8515b436ed2fca1))

## [0.12.16](https://github.com/stocka-app/stocka-client/compare/v0.12.15...v0.12.16) (2026-03-26)

### 🐛 Bug Fixes

* **layout:** [STOC-255](https://austins-industries.atlassian.net/browse/STOC-255) — normalize avatar and logout to design system tokens and icon sizes ([5715aa3](https://github.com/stocka-app/stocka-client/commit/5715aa3f5d2ad84a3da1c33549d8f45553824108))

## [0.12.15](https://github.com/stocka-app/stocka-client/compare/v0.12.14...v0.12.15) (2026-03-26)

### 🐛 Bug Fixes

* **layout:** [STOC-255](https://austins-industries.atlassian.net/browse/STOC-255) — normalize bottom icon sizes to h-5 w-5 across Bell and LanguageSwitcher ([96089dc](https://github.com/stocka-app/stocka-client/commit/96089dc966163161ed6443fbb79615606e9d0bfa))

## [0.12.14](https://github.com/stocka-app/stocka-client/compare/v0.12.13...v0.12.14) (2026-03-26)

### 🐛 Bug Fixes

* **layout:** [STOC-255](https://austins-industries.atlassian.net/browse/STOC-255) — move collapse toggle away from business selector arrow ([4855bb0](https://github.com/stocka-app/stocka-client/commit/4855bb0590e1245ba6695e59a6c0056f016b7cf3))

## [0.12.13](https://github.com/stocka-app/stocka-client/compare/v0.12.12...v0.12.13) (2026-03-26)

### 🐛 Bug Fixes

* **layout:** [STOC-255](https://austins-industries.atlassian.net/browse/STOC-255) — move business selector up next to logo ([e47e5c0](https://github.com/stocka-app/stocka-client/commit/e47e5c0671761dbf4ef94b5db5bbbf599d711ad8))

## [0.12.12](https://github.com/stocka-app/stocka-client/compare/v0.12.11...v0.12.12) (2026-03-26)

### 🐛 Bug Fixes

* **layout:** [STOC-255](https://austins-industries.atlassian.net/browse/STOC-255) — increase logo-to-nav spacing to pt-14 ([6e0267d](https://github.com/stocka-app/stocka-client/commit/6e0267d2eca3aaedb7236ce1a7b81c7fbb612750))

## [0.12.11](https://github.com/stocka-app/stocka-client/compare/v0.12.10...v0.12.11) (2026-03-26)

### 🐛 Bug Fixes

* **layout:** [STOC-255](https://austins-industries.atlassian.net/browse/STOC-255) — restore spacing between logo and nav items ([de65b37](https://github.com/stocka-app/stocka-client/commit/de65b37715b52047d06086e4b889b15f10a8b99b))

## [0.12.10](https://github.com/stocka-app/stocka-client/compare/v0.12.9...v0.12.10) (2026-03-26)

### 🐛 Bug Fixes

* **layout:** [STOC-255](https://austins-industries.atlassian.net/browse/STOC-255) — fix business selector arrow rotation to 180deg ([6578a97](https://github.com/stocka-app/stocka-client/commit/6578a979bf76dd7a778350b2d0a9042ba39dc52e))

## [0.12.9](https://github.com/stocka-app/stocka-client/compare/v0.12.8...v0.12.9) (2026-03-26)

### 🐛 Bug Fixes

* **layout:** [STOC-255](https://austins-industries.atlassian.net/browse/STOC-255) — replace ChevronDown with ChevronRight on business selector ([d27e236](https://github.com/stocka-app/stocka-client/commit/d27e236023afaf54d3fe2e8725a76882f8907804))

## [0.12.8](https://github.com/stocka-app/stocka-client/compare/v0.12.7...v0.12.8) (2026-03-26)

### 🐛 Bug Fixes

* **layout:** [STOC-255](https://austins-industries.atlassian.net/browse/STOC-255) — move business selector outside nav to fix popover overflow clipping ([705222f](https://github.com/stocka-app/stocka-client/commit/705222fa8694747d2a15562e259d8bade3949655))

## [0.12.7](https://github.com/stocka-app/stocka-client/compare/v0.12.6...v0.12.7) (2026-03-26)

### 🐛 Bug Fixes

* **layout:** [STOC-255](https://austins-industries.atlassian.net/browse/STOC-255) — business selector as floating popover with click-outside dismiss ([6ee0bee](https://github.com/stocka-app/stocka-client/commit/6ee0beeae7893b815ce3eddf8a7da066d5206295))

## [0.12.6](https://github.com/stocka-app/stocka-client/compare/v0.12.5...v0.12.6) (2026-03-26)

### 🐛 Bug Fixes

* **layout:** business selector toggles open/close on click ([5e39b0e](https://github.com/stocka-app/stocka-client/commit/5e39b0e7e6a77a78b2b856d09d33a7b7bdb67abb))

## [0.12.5](https://github.com/stocka-app/stocka-client/compare/v0.12.4...v0.12.5) (2026-03-26)

### 🐛 Bug Fixes

* **layout:** move business selector into nav, add visual options preview ([635f862](https://github.com/stocka-app/stocka-client/commit/635f86215f914189d9ed3ffac47439bb01a28b6e))

## [0.12.4](https://github.com/stocka-app/stocka-client/compare/v0.12.3...v0.12.4) (2026-03-26)

### 🐛 Bug Fixes

* **layout:** pt-10 → pt-14 logo-to-nav gap ([0a89dd0](https://github.com/stocka-app/stocka-client/commit/0a89dd04365e436c8a8295a324d9687b73ad9e3a))

## [0.12.3](https://github.com/stocka-app/stocka-client/compare/v0.12.2...v0.12.3) (2026-03-26)

### 🐛 Bug Fixes

* **layout:** more gap between logo and nav — pt-6 → pt-10 ([77c1ed5](https://github.com/stocka-app/stocka-client/commit/77c1ed5a77cd23c9a0715057af9fb75b9b3e97c4))

## [0.12.2](https://github.com/stocka-app/stocka-client/compare/v0.12.1...v0.12.2) (2026-03-26)

### 🐛 Bug Fixes

* **layout:** increase gap between logo and nav items — pt-1 → pt-6 ([6941497](https://github.com/stocka-app/stocka-client/commit/694149767d38404b704d5d2b09b9c48beadb3a87))

## [0.12.1](https://github.com/stocka-app/stocka-client/compare/v0.12.0...v0.12.1) (2026-03-26)

### 🐛 Bug Fixes

* **layout:** match reference sidebar typography — text-base, clearer active state ([c79dc86](https://github.com/stocka-app/stocka-client/commit/c79dc8648e192d0b4e8be48037b725911a6ad4f5))

## [0.12.0](https://github.com/stocka-app/stocka-client/compare/v0.11.10...v0.12.0) (2026-03-26)

### ✨ Features

* **design-system:** switch app font from Plus Jakarta Sans to Inter ([46ca99c](https://github.com/stocka-app/stocka-client/commit/46ca99c77fb53fd93cf44b3715b6c185f6594c7e))

## [0.11.10](https://github.com/stocka-app/stocka-client/compare/v0.11.9...v0.11.10) (2026-03-26)

### 🐛 Bug Fixes

* **layout:** larger logo, bigger wordmark, more breathing room above nav ([5431e60](https://github.com/stocka-app/stocka-client/commit/5431e60e5fa3b74e78217eb2992b7ac50fa7bd29))

## [0.11.9](https://github.com/stocka-app/stocka-client/compare/v0.11.8...v0.11.9) (2026-03-26)

### 🐛 Bug Fixes

* **design-system:** unify dark mode sidebar and page background ([c15ac98](https://github.com/stocka-app/stocka-client/commit/c15ac98e858a71a0733f209dcd89951666db0553)), closes [#0d1526](https://github.com/stocka-app/stocka-client/issues/0d1526) [#0b1221](https://github.com/stocka-app/stocka-client/issues/0b1221) [#0b1221](https://github.com/stocka-app/stocka-client/issues/0b1221) [#FFFFFF](https://github.com/stocka-app/stocka-client/issues/FFFFFF)

## [0.11.8](https://github.com/stocka-app/stocka-client/compare/v0.11.7...v0.11.8) (2026-03-26)

### 🐛 Bug Fixes

* **layout:** remove border from business selector — matches nav item style ([8abf943](https://github.com/stocka-app/stocka-client/commit/8abf94321800330338ac53245920836cf83fa177))

## [0.11.7](https://github.com/stocka-app/stocka-client/compare/v0.11.6...v0.11.7) (2026-03-26)

### 🐛 Bug Fixes

* **layout:** remove all internal sidebar dividers — keep only border-r ([33db3a3](https://github.com/stocka-app/stocka-client/commit/33db3a3cff42459c916809604664572a87bc862f))

## [0.11.6](https://github.com/stocka-app/stocka-client/compare/v0.11.5...v0.11.6) (2026-03-26)

### 🐛 Bug Fixes

* **design-system:** unify light mode surface — page=white matches sidebar ([b2362fa](https://github.com/stocka-app/stocka-client/commit/b2362fac96613c1199d20d1657d7dd7bfea8aa33)), closes [#F3F4F6](https://github.com/stocka-app/stocka-client/issues/F3F4F6) [#FFFFFF](https://github.com/stocka-app/stocka-client/issues/FFFFFF) [#F3F4F6](https://github.com/stocka-app/stocka-client/issues/F3F4F6)

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
