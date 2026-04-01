import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'node:path';

/** Vite config for Playwright E2E — proxies /api to the dedicated stocka_playwright backend on port 3002. */
export default defineConfig({
  plugins: [
    react({
      ...(process.env.COVERAGE === 'true' && {
        babel: {
          plugins: [
            [
              'istanbul',
              {
                include: ['src/**/*.{ts,tsx}'],
                exclude: ['src/test/**', 'src/**/*.types.ts', 'src/**/index.ts'],
              },
            ],
          ],
        },
      }),
    }),
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    port: 5174,
    proxy: {
      '/api': {
        target: 'http://localhost:3002',
        changeOrigin: true,
      },
    },
  },
});
