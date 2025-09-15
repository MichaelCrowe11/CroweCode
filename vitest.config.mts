// vitest.config.mts - ESM configuration to avoid Vite CJS deprecation warning
import { defineConfig } from 'vitest/config';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import react from '@vitejs/plugin-react';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    globals: true,
    include: ['src/**/*.test.{ts,tsx}', 'src/**/*.spec.{ts,tsx}', 'test/**/*.test.{ts,tsx}'],
    exclude: [
      '**/node_modules/**',
      '**/dist/**',
      '**/.next/**',
      '**/e2e/**',
      '**/playwright-tests/**',
      '**/tests/e2e/**',
      '**/tests/integration/**',
      '**/tests/performance/**'
    ],
    setupFiles: ['./test/setup.ts'],
    coverage: {
      enabled: false, // Enable later when we have more tests
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/',
        'test/',
        '**/*.d.ts',
        '**/*.config.*',
        '**/coverage/**'
      ]
    },
    // Increase timeout for tests that might interact with external APIs
    testTimeout: 10000,
    // Mock external dependencies by default
    deps: {
      inline: ['@testing-library/react']
    }
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, './src'),
    },
  },
  // Handle PostCSS imports in tests
  css: {
    postcss: './postcss.config.mjs',
  },
});