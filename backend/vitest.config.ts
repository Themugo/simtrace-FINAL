import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    env: {
      JWT_SECRET: 'test-secret-key',
    },
    include: ['__tests__/**/*.test.ts', 'tests/**/*.test.ts'],
    hookTimeout: 60000,
    testTimeout: 30000,
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      include: ['routes/**/*.ts', 'services/**/*.ts', 'middleware/**/*.ts'],
      thresholds: {
        branches: 50,
        functions: 50,
        lines: 50,
        statements: 50,
      },
    },
  },
});
