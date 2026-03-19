import { defineConfig } from 'vite'
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
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/test/setup.ts'],
    // Exclude Playwright e2e specs — they run via `npm run test:e2e`, not Vitest
    exclude: ['**/node_modules/**', '**/dist/**', 'e2e/**'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'lcov', 'html'],
      // Blacklist strategy: include everything, exclude only what is truly not unit-testable
      include: ['src/**/*.{ts,tsx}'],
      exclude: [
        // Bootstrap / entry points
        'src/main.tsx',
        'src/app/App.tsx',
        'src/app/router.tsx',
        // Complex integration: router + silent-refresh on mount
        'src/app/providers.tsx',
        // Module-level side effects that execute on import (import.meta.env, i18next init)
        'src/shared/lib/env.ts',
        'src/shared/lib/i18n.ts',
        // HTTP interceptors — integration scope (requires live server or axios-mock-adapter)
        'src/shared/lib/axios.ts',
        // Barrel re-export files (no logic)
        'src/**/index.ts',
        // Type-only files
        'src/**/*.types.ts',
        'src/shared/types/**',
        // shadcn/ui generated components (third-party wrappers)
        'src/shared/components/ui/**',
        // SVG illustration components
        'src/shared/components/illustrations/**',
        // Test utility component (intentionally throws)
        'src/shared/components/ThrowError.tsx',
        // Legacy / dead code folder (superseded by features/authentication)
        'src/features/auth/**',
        // Test infrastructure
        'src/test/**',
        'src/features/authentication/api/authentication.mock.ts',
        // HTTP service — integration scope (calls real API)
        'src/features/authentication/api/authentication.service.ts',
        // Onboarding: HTTP service + mock + pages (integration scope)
        'src/features/onboarding/api/onboarding.service.ts',
        'src/features/onboarding/api/onboarding.mock.ts',
        'src/features/onboarding/pages/**',
        // Organization: HTTP service + mock + pages (integration scope)
        'src/features/organization/api/organization.service.ts',
        'src/features/organization/api/organization.mock.ts',
        'src/features/organization/pages/**',
        // Complex stateful form component with file upload — integration scope
        'src/features/organization/components/OrgEditForm.tsx',
        // Team: RBAC stubs (will be covered when STOC-256 RBAC is implemented)
        'src/features/team/**',
        // Placeholder feature with no real logic
        'src/features/dashboard/**',
        // Complex stateful form components — integration / e2e scope
        'src/features/authentication/components/LoginForm.tsx',
        'src/features/authentication/components/RegisterForm.tsx',
        'src/features/authentication/components/VerifyEmailForm.tsx',
        'src/features/authentication/components/ExpirationTimer.tsx',
        'src/features/authentication/components/ResendButton.tsx',
        'src/features/authentication/components/VerificationCodeInput.tsx',
        // Pages — complex forms + routing, integration scope
        'src/features/authentication/pages/**',
        // Layout wrappers — pure structural UI with Outlet, no business logic to unit test
        'src/shared/layouts/**',
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
