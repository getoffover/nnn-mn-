```ts
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@src': path.resolve(__dirname, './src'),
      '@domain': path.resolve(__dirname, './src/domain'),
      '@application': path.resolve(__dirname, './src/application'),
      '@infrastructure': path.resolve(__dirname, './src/infrastructure'),
      '@presentation': path.resolve(__dirname, './src/presentation'),
      '@shared': path.resolve(__dirname, './src/shared'),
      '@tests': path.resolve(__dirname, './src/__tests__'),
    },
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/__tests__/utils/testHelpers.ts'],
    include: ['src/__tests__/**/*.test.ts', 'src/__tests__/**/*.test.tsx'],
    exclude: ['src/__tests__/e2e/**/*.spec.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      include: ['src/**/*.{ts,tsx}'],
      exclude: [
        'src/__tests__/**',
        'src/**/*.d.ts',
        'src/**/*.test.{ts,tsx}',
        'src/**/worker/*.ts',
        'src/infrastructure/electron/*.ts',
        'src/presentation/router/*.tsx',
        'src/presentation/hooks/*.ts',
        'src/presentation/components/shared/*.tsx',
        'src/presentation/styles/*.ts',
        'src/shared/constants.ts',
        'src/shared/utils.ts',
        'src/main.ts',
        'src/preload.ts',
        'src/renderer.tsx',
        'src/Root.tsx',
        'src/App.tsx',
        'vite.config.ts',
        'vitest.config.ts',
        'playwright.config.ts',
        'electron-builder.json',
        'tailwind.config.js',
      ],
      thresholds: {
        statements: 90,
        branches: 90,
        functions: 90,
        lines: 90,
      },
    },
    typecheck: {
      enabled: true,
      tsconfig: './tsconfig.test.json',
    },
    reporters: ['verbose', 'dot'],
    slowTestThreshold: 5000,
    pool: 'threads',
    poolOptions: {
      threads: {
        singleThread: false,
        useAtomics: true,
      },
    },
    hookTimeout: 30000,
    teardownTimeout: 30000,
  },
});
```