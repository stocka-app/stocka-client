import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import path from 'node:path'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:3001',
        changeOrigin: true,
      },
    },
  },
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/test/setup.ts'],
    pool: 'forks',
    forks: {
      singleFork: true,
    },
    // Exclude Playwright e2e specs — they run via `npm run test:e2e`, not Vitest
    exclude: ['**/node_modules/**', '**/dist/**', 'e2e/**'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'lcov', 'html'],
      // Blacklist strategy: include everything, exclude only what is truly not unit-testable
      include: ['src/**/*.{ts,tsx}'],
      exclude: [
        // ── BOOTSTRAP (not exercisable in unit tests) ──────────────────────
        'src/main.tsx',
        'src/app/App.tsx',
        'src/app/router.tsx',
        'src/app/providers.tsx',

        // ── MODULE-LEVEL SIDE EFFECTS (execute on import) ──────────────────
        'src/shared/lib/env.ts',
        'src/shared/lib/i18n.ts',

        // ── BOILERPLATE (no runtime logic) ─────────────────────────────────
        'src/**/index.ts',
        'src/**/*.types.ts',
        'src/shared/types/**',

        // ── GENERATED / THIRD-PARTY (not our code) ─────────────────────────
        'src/shared/components/ui/**',
        'src/shared/components/illustrations/**',

        // ── PAGES (integration / e2e scope, not unit-testable) ─────────────
        'src/features/*/pages/**',

        // ── COMPLEX FORMS (stateful — covered by e2e, not unit tests) ──────
        'src/features/authentication/components/LoginForm.tsx',
        'src/features/authentication/components/RegisterForm.tsx',
        'src/features/authentication/components/VerifyEmailForm.tsx',
        'src/features/authentication/components/ExpirationTimer.tsx',
        'src/features/authentication/components/ResendButton.tsx',
        'src/features/authentication/components/VerificationCodeInput.tsx',
        'src/features/storages/components/CreateStorageDrawer.tsx',

        // ── SERVICES / INFRA (require live HTTP — tested in e2e) ───────────
        'src/features/authentication/api/authentication.service.ts',
        'src/shared/lib/axios.ts',

        // ── TEST INFRASTRUCTURE ────────────────────────────────────────────
        'src/test/**',
        'src/shared/components/ThrowError.tsx',
        'src/features/*/api/*.mock.ts',
      ],
      thresholds: {
        statements: 100,
        branches: 100,
        functions: 100,
        lines: 100,
      },
    },
  },
})
