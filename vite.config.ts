```ts
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@domain': path.resolve(__dirname, './src/domain'),
      '@application': path.resolve(__dirname, './src/application'),
      '@infrastructure': path.resolve(__dirname, './src/infrastructure'),
      '@presentation': path.resolve(__dirname, './src/presentation'),
      '@shared': path.resolve(__dirname, './src/shared'),
      '@tests': path.resolve(__dirname, './src/__tests__'),
    },
    extensions: ['.ts', '.tsx', '.js', '.jsx', '.json'],
  },
  build: {
    outDir: 'dist',
    sourcemap: true,
    minify: 'esbuild',
    target: 'es2020',
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom', 'react-router-dom'],
          state: ['zustand', 'immer'],
          ui: ['@headlessui/react', 'framer-motion'],
          cv: ['onnxruntime-web', 'tesseract.js'],
        },
      },
    },
  },
  server: {
    port: 5173,
    open: true,
    fs: {
      allow: ['..'],
    },
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/__tests__/utils/testHelpers.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/',
        'dist/',
        '**/*.d.ts',
        '**/testHelpers.ts',
        '**/*.spec.ts',
        '**/*.test.ts',
        'src/__tests__/',
        'electron-builder.json',
        'tailwind.config.js',
        'vite.config.ts',
        'vitest.config.ts',
        'playwright.config.ts',
      ],
    },
    include: ['src/__tests__/**/*.test.ts{,x}'],
  },
});
```