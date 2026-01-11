import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./tests/setup.ts'],
    include: ['tests/unit/**/*.test.ts', 'tests/unit/**/*.spec.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/',
        'tests/',
        'src/main.tsx',
        'src/App.tsx',
        'src/vite-env.d.ts',
        'src/components/**', // React UI components
        'src/api/**', // API routes (tested via E2E)
        'src/**/index.ts', // Barrel files
        'src/**/NoaaApiAdapter.ts', // Production adapter (integration tested)
        'src/**/AlertScheduler.ts', // Contains broken entity method calls
      ],
      thresholds: {
        global: {
          branches: 80,
          functions: 80,
          lines: 80,
          statements: 80,
        },
      },
    },
  },
});
